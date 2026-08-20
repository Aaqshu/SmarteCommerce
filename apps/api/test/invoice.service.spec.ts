import { Test } from '@nestjs/testing';
import { InvoiceService } from '../src/invoice/invoice.service';
import { TaxEngineService } from '../src/gst/tax-engine.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('InvoiceService (unit, mocked pool)', () => {
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

  it('determines the financial year', () => {
    expect(service.financialYear(new Date('2025-07-01'))).toBe('2025-26');
    expect(service.financialYear(new Date('2025-01-01'))).toBe('2024-25');
    expect(service.financialYear(new Date('2024-04-01'))).toBe('2024-25');
  });

  it('generates the next invoice number (atomic series counter)', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [{ LastNumber: 3 }] }); // SELECT FOR UPDATE
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // UPDATE
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

    const num = await service.nextInvoiceNumber('tenant_demo', 'ZJ', '2025-26');
    expect(num).toBe('ZJ/25-26/0004');
    // must lock the series row
    expect(mockClient.query.mock.calls[1][0]).toContain('FOR UPDATE');
  });

  it('starts at 0001 when no series exists', async () => {
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // BEGIN
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // SELECT FOR UPDATE -> no row
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // INSERT
    mockClient.query.mockResolvedValueOnce({ rows: [] }); // COMMIT

    const num = await service.nextInvoiceNumber('tenant_demo', 'ZJ', '2025-26');
    expect(num).toBe('ZJ/25-26/0001');
    expect(mockClient.query.mock.calls[2][0]).toContain('INSERT');
  });

  it('builds a tax invoice with CGST/SGST split from the engine', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        OrderId: 'o1',
        OrderNumber: 'ORD-1',
        TaxableValue: '100000.00',
        Cgst: '1500.00',
        Sgst: '1500.00',
        Igst: '0',
        Cess: '0',
        ShippingCharges: '0',
        GrandTotal: '103000.00',
        GstType: 'intra',
        CustomerGstin: null,
        Status: 'confirmed',
      }],
    }); // order lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [{ StoreName: 'Zainab Jewellers', Gstin: '09ABCDE1234F1Z0', StateCode: 'UP', Address: 'Lucknow, UP' }],
    }); // tenant config lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [{ InvoiceId: 'i1', InvoiceNo: 'ZJ/25-26/0001', OrderId: 'o1', FinancialYear: '2025-26', SellerGstin: '09ABCDE1234F1Z0', BuyerGstin: null, InvoiceType: 'tax_invoice', EinvoiceJson: null }],
    }); // invoice insert
    // series counter (client): BEGIN, SELECT FOR UPDATE (no row), INSERT, COMMIT
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const invoice = await service.createTaxInvoice('tenant_demo', 'o1');

    expect(invoice.InvoiceNo).toMatch(/^ZJ\/\d{2}-\d{2}\/\d{4}$/);
    expect(invoice.InvoiceType).toBe('tax_invoice');
    expect(invoice.SellerGstin).toBe('09ABCDE1234F1Z0');
  });

  it('builds the e-invoice JSON structure (IRN-ready)', () => {
    const json = service.buildEinvoiceJson({
      invoiceNo: 'ZJ/25-26/0001',
      sellerGstin: '09ABCDE1234F1Z0',
      buyerGstin: null,
      taxableValue: 100000,
      cgst: 1500,
      sgst: 1500,
      igst: 0,
      cess: 0,
      grandTotal: 103000,
      buyerName: 'Aaquib Khan',
      buyerState: 'UP',
      sellerState: 'UP',
    });

    expect(json.Version).toBe('1.1');
    expect(json.DocType).toBe('INV');
    expect(json.SellerGstin).toBe('09ABCDE1234F1Z0');
    expect(json.Val).toBe(103000);
    expect(json.TranDtls.SupTyp).toBe('B2C');
    expect(json.TranDtls.Igst).toBe(0);
    expect(json.TranDtls.Cgst).toBe(1500);
    expect(json.TranDtls.Sgst).toBe(1500);
  });
});
