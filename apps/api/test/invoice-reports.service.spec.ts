import { Test } from '@nestjs/testing';
import { InvoiceService } from '../src/invoice/invoice.service';
import { TaxEngineService } from '../src/gst/tax-engine.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('InvoiceService — credit notes + GSTR reports (unit)', () => {
  let service: InvoiceService;
  let mockPool: { query: jest.Mock; connect: jest.Mock };
  let mockClient: { query: jest.Mock; release: jest.Mock };

  const mockTenantDb = { getDb: jest.fn() };

  beforeEach(async () => {
    mockClient = { query: jest.fn(), release: jest.fn() };
    mockPool = { query: jest.fn(), connect: jest.fn().mockResolvedValue(mockClient) };
    mockTenantDb.getDb.mockReturnValue(mockPool);

    const moduleRef = await Test.createTestingModule({
      providers: [
        InvoiceService,
        TaxEngineService,
        { provide: TenantDbService, useValue: mockTenantDb },
      ],
    }).compile();

    service = moduleRef.get(InvoiceService);
  });

  it('creates a credit note for a returned order', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        OrderId: 'o1',
        OrderNumber: 'ORD-1',
        TaxableValue: '100000.00',
        Cgst: '1500.00',
        Sgst: '1500.00',
        Igst: '0',
        Cess: '0',
        GrandTotal: '103000.00',
        CustomerGstin: null,
        Status: 'returned',
      }],
    }); // order lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [{ StoreName: 'Zainab Jewellers', Gstin: '09ABCDE1234F1Z0' }],
    }); // tenant config
    mockPool.query.mockResolvedValueOnce({
      rows: [{ InvoiceId: 'cn1', InvoiceNo: 'ZJ/25-26/CN0001', OrderId: 'o1', InvoiceType: 'credit_note' }],
    }); // insert
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const cn = await service.createCreditNote('tenant_demo', 'o1', 'Damaged item');
    expect(cn.InvoiceType).toBe('credit_note');
    expect(cn.InvoiceNo).toContain('CN');
  });

  it('rejects credit note for non-returned order', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ Status: 'delivered', OrderId: 'o1' }],
    });

    await expect(service.createCreditNote('tenant_demo', 'o1', 'test')).rejects.toThrow('returned');
  });

  it('builds GSTR-1 summary (outward supplies)', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { GstType: 'intra', TaxableValue: '100000.00', Cgst: '1500.00', Sgst: '1500.00', Igst: '0', InvoiceCount: '1' },
        { GstType: 'inter', TaxableValue: '50000.00', Cgst: '0', Sgst: '0', Igst: '1500.00', InvoiceCount: '1' },
      ],
    }); // B2C invoices
    mockPool.query.mockResolvedValueOnce({
      rows: [{ GstType: 'intra', TaxableValue: '20000.00', Cgst: '300.00', Sgst: '300.00', Igst: '0', InvoiceCount: '1' }],
    }); // B2B invoices
    mockPool.query.mockResolvedValueOnce({
      rows: [{ TaxableValue: '10000.00', Cgst: '150.00', Sgst: '150.00', Igst: '0', InvoiceCount: '1' }],
    }); // credit notes

    const report = await service.gstr1('tenant_demo', '2025-26');

    expect(report.financialYear).toBe('2025-26');
    expect(report.b2c.taxableValue).toBe(150000);
    expect(report.b2c.igst).toBe(1500);
    expect(report.b2b.taxableValue).toBe(20000);
    expect(report.creditNotes.taxableValue).toBe(10000);
    expect(report.totals.taxableValue).toBe(170000);
  });

  it('builds GSTR-3B summary (monthly return)', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { TaxableValue: '120000.00', Cgst: '1800.00', Sgst: '1800.00', Igst: '1500.00', Cess: '0' },
      ],
    }); // outward supplies
    mockPool.query.mockResolvedValueOnce({
      rows: [{ TaxableValue: '0', Cgst: '0', Sgst: '0', Igst: '0' }],
    }); // inward supplies

    const report = await service.gstr3b('tenant_demo', '2025', '26');

    expect(report.month).toBe('26');
    expect(report.outward.taxableValue).toBe(120000);
    expect(report.outward.cgst).toBe(1800);
    expect(report.outward.sgst).toBe(1800);
    expect(report.outward.igst).toBe(1500);
  });
});
