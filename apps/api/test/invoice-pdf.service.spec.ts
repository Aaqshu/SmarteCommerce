import { Test } from '@nestjs/testing';
import { InvoiceService } from '../src/invoice/invoice.service';
import { TaxEngineService } from '../src/gst/tax-engine.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('InvoiceService — PDF rendering (unit)', () => {
  let service: InvoiceService;
  let mockPool: { query: jest.Mock };

  const mockTenantDb = { getDb: jest.fn() };

  beforeEach(async () => {
    mockPool = { query: jest.fn() };
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

  it('renders a valid A4 PDF with invoice data', async () => {
    const buffer = await service.renderPdf({
      invoice: { InvoiceId: 'i1', InvoiceNo: 'ZJ/25-26/0001', OrderId: 'o1', FinancialYear: '2025-26', InvoiceType: 'tax_invoice' },
      order: { OrderNumber: 'ORD-1001', TaxableValue: '85000.00', Cgst: '1275.00', Sgst: '1275.00', Igst: '0', GrandTotal: '87550.00', Notes: 'Test' },
      items: [
        { Name: 'Zainab 22K Gold Ring', HsnCode: '7113', GstRate: '3.00', Qty: '1', UnitPrice: '85000.00', TaxableValue: '85000.00', Cgst: '1275.00', Sgst: '1275.00', Igst: '0', Total: '87550.00' },
      ],
      tenant: { StoreName: 'Zainab Jewellers', Gstin: '09ABCDE1234F1Z0', Address: 'Lucknow', StateCode: 'UP' },
    });

    // PDF magic header: %PDF
    expect(buffer.slice(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('returns null for unknown invoice (getInvoice)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    const result = await service.getInvoice('tenant_demo', 'nope');
    expect(result).toBeNull();
  });
});
