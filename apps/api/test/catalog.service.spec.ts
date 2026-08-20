import { Test } from '@nestjs/testing';
import { CatalogService } from '../src/catalog/catalog.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('CatalogService (unit, mocked pool)', () => {
  let service: CatalogService;
  let mockPool: { query: jest.Mock };

  const mockTenantDb = {
    getDb: jest.fn(),
  };

  beforeEach(async () => {
    mockPool = { query: jest.fn() };
    mockTenantDb.getDb.mockReturnValue(mockPool);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: TenantDbService, useValue: mockTenantDb },
      ],
    }).compile();

    service = moduleRef.get(CatalogService);
  });

  it('lists products with category info', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          ProductId: '11111111-1111-1111-1111-111111111111',
          Name: 'Zainab 22K Gold Ring',
          Slug: 'zainab-22k-gold-ring',
          HsnCode: '7113',
          GstRate: '3.00',
          Mrp: '85000.00',
          SellingPrice: '85000.00',
          Status: 'active',
        },
      ],
    });

    const result = await service.listProducts('tenant_demo', {});
    expect(result).toHaveLength(1);
    expect(result[0].Name).toBe('Zainab 22K Gold Ring');
    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining('Products'), expect.any(Array));
  });

  it('filters products by category slug', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    await service.listProducts('tenant_demo', { category: 'rings' });
    const [, params] = mockPool.query.mock.calls[0];
    expect(params).toContain('rings');
  });

  it('returns a single product by slug', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ProductId: 'x', Name: 'Test', Slug: 'test' }],
    });

    const result = await service.getProduct('tenant_demo', 'test');
    expect(result).not.toBeNull();
    expect(result!.Name).toBe('Test');
  });

  it('returns null when product not found', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await service.getProduct('tenant_demo', 'missing');
    expect(result).toBeNull();
  });

  it('creates a product', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ProductId: 'new', Name: 'Necklace', Slug: 'necklace' }],
    });

    const result = await service.createProduct('tenant_demo', {
      name: 'Necklace',
      slug: 'necklace',
      mrp: 50000,
      sellingPrice: 45000,
      hsnCode: '7113',
      gstRate: 3,
    });
    expect(result.ProductId).toBe('new');
  });

  it('updates a product', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ProductId: 'x', Name: 'Updated', Slug: 'test' }],
    });

    const result = await service.updateProduct('tenant_demo', 'x', { name: 'Updated' });
    expect(result).not.toBeNull();
    expect(result!.Name).toBe('Updated');
  });
});
