import { Test } from '@nestjs/testing';
import { HsnService } from '../src/gst/hsn.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('HsnService (unit, mocked pool)', () => {
  let service: HsnService;
  let mockPool: { query: jest.Mock };

  const mockTenantDb = { getDb: jest.fn() };

  beforeEach(async () => {
    mockPool = { query: jest.fn() };
    mockTenantDb.getDb.mockReturnValue(mockPool);

    const moduleRef = await Test.createTestingModule({
      providers: [HsnService, { provide: TenantDbService, useValue: mockTenantDb }],
    }).compile();

    service = moduleRef.get(HsnService);
  });

  it('lists all tax rates', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { HsnCode: '7113', Cgst: '1.50', Sgst: '1.50', Igst: '3.00' },
        { HsnCode: '7108', Cgst: '1.50', Sgst: '1.50', Igst: '3.00' },
      ],
    });

    const result = await service.list('tenant_demo');
    expect(result).toHaveLength(2);
    expect(result[0].HsnCode).toBe('7113');
  });

  it('finds a rate by HSN code', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ HsnCode: '7113', Cgst: '1.50', Sgst: '1.50', Igst: '3.00', Cess: '0' }],
    });

    const result = await service.findByHsn('tenant_demo', '7113');
    expect(result?.Igst).toBe('3.00');
  });

  it('returns null for unknown HSN', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await service.findByHsn('tenant_demo', '9999');
    expect(result).toBeNull();
  });

  it('upserts a tax rate (insert on new)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ HsnCode: '7114' }] });

    await service.upsert('tenant_demo', {
      hsnCode: '7114',
      description: 'Gold jewellery',
      cgst: 1.5,
      sgst: 1.5,
      igst: 3,
      cess: 0,
    });

    expect(mockPool.query.mock.calls[0][0]).toContain('ON CONFLICT');
    expect(mockPool.query.mock.calls[0][1]).toEqual(['7114', 'Gold jewellery', 1.5, 1.5, 3, 0]);
  });

  it('seeds standard GST rate slabs', async () => {
    mockPool.query.mockResolvedValue({ rows: [] }); // every insert

    await service.seedStandardRates('tenant_demo');
    // 7 slabs: 0, 0.25, 3, 5, 12, 18, 28
    const calls = mockPool.query.mock.calls;
    expect(calls.length).toBe(7);
    expect(calls[0][0]).toContain('ON CONFLICT');
    // 18% slab -> HSN prefix '1800', 9% CGST + 9% SGST
    const slab18 = calls.find((c) => c[1] && c[1][0] === '1800');
    expect(slab18[1][2]).toBe(9); // cgst
    expect(slab18[1][3]).toBe(9); // sgst
  });
});
