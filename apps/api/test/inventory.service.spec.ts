import { Test } from '@nestjs/testing';
import { InventoryService } from '../src/inventory/inventory.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('InventoryService (unit, mocked pool)', () => {
  let service: InventoryService;
  let mockPool: { query: jest.Mock; connect: jest.Mock };
  let mockClient: { query: jest.Mock; release: jest.Mock };

  const mockTenantDb = {
    getDb: jest.fn(),
  };

  beforeEach(async () => {
    mockClient = { query: jest.fn(), release: jest.fn() };
    mockPool = { query: jest.fn(), connect: jest.fn().mockResolvedValue(mockClient) };
    mockTenantDb.getDb.mockReturnValue(mockPool);

    const moduleRef = await Test.createTestingModule({
      providers: [InventoryService, { provide: TenantDbService, useValue: mockTenantDb }],
    }).compile();

    service = moduleRef.get(InventoryService);
  });

  it('gets stock for a product (0 if none)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const qty = await service.getStock('tenant_demo', 'p1');
    expect(qty).toBe(0);
  });

  it('gets stock quantity when a StockItem exists', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ Quantity: '5' }] });
    const qty = await service.getStock('tenant_demo', 'p1');
    expect(qty).toBe(5);
  });

  it('receives stock: creates StockItem + purchase_receipt movement', async () => {
    await service.receiveStock('tenant_demo', 'p1', 10, 1000);
    // BEGIN + upsert + movement + COMMIT = 4 client queries
    expect(mockClient.query).toHaveBeenCalledTimes(4);
    expect(mockClient.query.mock.calls[0][0]).toBe('BEGIN');
    // movement type must be purchase_receipt
    expect(mockClient.query.mock.calls[2][0]).toContain('purchase_receipt');
    expect(mockClient.query.mock.calls[2][0]).toContain('StockMovements');
    expect(mockClient.query.mock.calls[3][0]).toBe('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('issues stock: decrements with row lock and records sales_issue', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [{ Quantity: '10' }] }); // SELECT FOR UPDATE
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // update
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // movement
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

    await service.issueStock('tenant_demo', 'p1', 3);
    // second query must lock the row
    expect(mockClient.query.mock.calls[1][0]).toContain('FOR UPDATE');
    // update must set Quantity = Quantity - 3
    expect(mockClient.query.mock.calls[2][0]).toContain('Quantity" = "Quantity" - $');
    expect(mockClient.query.mock.calls[2][1]).toContain(3);
    // movement type must be sales_issue
    expect(mockClient.query.mock.calls[3][0]).toContain('sales_issue');
  });

  it('throws when issuing more than available stock', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [{ Quantity: '2' }] }); // SELECT FOR UPDATE

    await expect(service.issueStock('tenant_demo', 'p1', 5)).rejects.toThrow('Insufficient stock');
  });

  it('throws when issuing stock for a product with no StockItem', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // no row

    await expect(service.issueStock('tenant_demo', 'p1', 1)).rejects.toThrow('No stock record');
  });
});
