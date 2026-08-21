import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantDbService } from '../tenancy/tenant-db.service';
import { TaxEngineService } from '../gst/tax-engine.service';

export interface InvoiceRow {
  InvoiceId: string;
  InvoiceNo: string;
  OrderId: string;
  FinancialYear: string;
  SellerGstin?: string;
  BuyerGstin?: string;
  InvoiceType: string;
  EinvoiceJson?: unknown;
  Irn?: string;
}

export interface EinvoiceJson {
  Version: string;
  TranDtls: {
    SupTyp: 'B2B' | 'B2C';
    Igst: number;
    Cgst: number;
    Sgst: number;
    Cess: number;
  };
  DocDtls: { Typ: string; No: string; Dt: string };
  SellerDtls: { Gstin: string; LglNm?: string; Addr1?: string; Loc?: string; Pin?: number; Stcd: string };
  BuyerDtls: { Gstin?: string; LglNm: string; Addr1?: string; Loc?: string; Pin?: number; Stcd: string };
  ValDtls: { AssVal: number; CgstVal: number; SgstVal: number; IgstVal: number; CessVal: number; TotInvVal: number };
  SellerGstin: string;
  DocType: string;
  Val: number;
}

@Injectable()
export class InvoiceService {
  constructor(
    private tenantDb: TenantDbService,
    private taxEngine: TaxEngineService,
  ) {}

  private pool(tenantDbName: string) {
    return this.tenantDb.getDb(tenantDbName);
  }

  /** Indian financial year: Apr-Mar, e.g. "2025-26". */
  financialYear(date: Date = new Date()): string {
    const y = date.getFullYear();
    return date.getMonth() >= 3 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
  }

  /**
   * Atomically increments the per-year series counter and returns
   * the next invoice number: PREFIX/YY-YY/NNNN
   */
  async nextInvoiceNumber(tenantDbName: string, prefix: string, financialYear: string): Promise<string> {
    const pool = this.pool(tenantDbName);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT "LastNumber" FROM "InvoiceSeries"
         WHERE "FinancialYear" = $1 AND "Prefix" = $2 FOR UPDATE`,
        [financialYear, prefix],
      );

      let last = 0;
      if (rows.length > 0) {
        last = Number(rows[0].LastNumber);
        await client.query(
          `UPDATE "InvoiceSeries" SET "LastNumber" = $3, "UpdatedOn" = NOW()
           WHERE "FinancialYear" = $1 AND "Prefix" = $2`,
          [financialYear, prefix, last + 1],
        );
      } else {
        await client.query(
          `INSERT INTO "InvoiceSeries" ("FinancialYear", "Prefix", "LastNumber")
           VALUES ($1, $2, 1)`,
          [financialYear, prefix],
        );
      }
      await client.query('COMMIT');

      const [y1, y2] = financialYear.split('-');
      return `${prefix}/${y1.slice(2)}-${y2}/${String(last + 1).padStart(4, '0')}`;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /** Creates a tax invoice for a confirmed order. */
  async createTaxInvoice(tenantDbName: string, orderId: string): Promise<InvoiceRow> {
    const pool = this.pool(tenantDbName);

    const { rows: orders } = await pool.query(
      `SELECT "OrderId", "OrderNumber", "TaxableValue", "Cgst", "Sgst", "Igst", "Cess",
              "ShippingCharges", "GrandTotal", "GstType", "CustomerGstin", "Status"
       FROM "Orders" WHERE "OrderId" = $1`,
      [orderId],
    );
    if (orders.length === 0) throw new NotFoundException('Order not found');
    const order = orders[0];
    if (order.Status === 'cancelled') throw new BadRequestException('Cannot invoice a cancelled order');

    const { rows: tenants } = await pool.query(
      `SELECT "StoreName", "Gstin", "StateCode", "Address" FROM "TenantConfig" LIMIT 1`,
    );
    if (tenants.length === 0 || !tenants[0].Gstin) {
      throw new BadRequestException('Tenant GSTIN not configured');
    }

    const fy = this.financialYear();
    const invoiceNo = await this.nextInvoiceNumber(tenantDbName, 'ZJ', fy);
    const sellerGstin = tenants[0].Gstin;

    const einvoice = this.buildEinvoiceJson({
      invoiceNo,
      sellerGstin,
      buyerGstin: order.CustomerGstin || null,
      taxableValue: Number(order.TaxableValue),
      cgst: Number(order.Cgst),
      sgst: Number(order.Sgst),
      igst: Number(order.Igst),
      cess: Number(order.Cess),
      grandTotal: Number(order.GrandTotal),
      buyerName: 'Customer',
      buyerState: 'UP',
      sellerState: 'UP',
    });

    const { rows } = await pool.query(
      `INSERT INTO "Invoices" ("InvoiceNo", "OrderId", "FinancialYear", "SellerGstin", "BuyerGstin", "InvoiceType", "EinvoiceJson")
       VALUES ($1, $2, $3, $4, $5, 'tax_invoice', $6::jsonb)
       RETURNING "InvoiceId", "InvoiceNo", "OrderId", "FinancialYear", "SellerGstin", "BuyerGstin", "InvoiceType", "EinvoiceJson"`,
      [invoiceNo, orderId, fy, sellerGstin, order.CustomerGstin || null, JSON.stringify(einvoice)],
    );
    return rows[0];
  }

  /** Creates a credit note for a returned order. */
  async createCreditNote(tenantDbName: string, orderId: string, reason: string): Promise<InvoiceRow> {
    const pool = this.pool(tenantDbName);

    const { rows: orders } = await pool.query(
      `SELECT "OrderId", "OrderNumber", "TaxableValue", "Cgst", "Sgst", "Igst", "Cess",
              "GrandTotal", "CustomerGstin", "Status"
       FROM "Orders" WHERE "OrderId" = $1`,
      [orderId],
    );
    if (orders.length === 0) throw new NotFoundException('Order not found');
    if (orders[0].Status !== 'returned') {
      throw new BadRequestException('Credit note requires a returned order');
    }
    const order = orders[0];

    const { rows: tenants } = await pool.query(
      `SELECT "StoreName", "Gstin" FROM "TenantConfig" LIMIT 1`,
    );
    const sellerGstin = tenants[0]?.Gstin;
    if (!sellerGstin) throw new BadRequestException('Tenant GSTIN not configured');

    const fy = this.financialYear();
    const cnNo = await this.nextInvoiceNumber(tenantDbName, 'ZJCN', fy);
    const invoiceNo = cnNo.replace('ZJCN/', 'ZJ/').replace(/(\d{4})$/, `CN${'$1'}`);

    const { rows } = await pool.query(
      `INSERT INTO "Invoices" ("InvoiceNo", "OrderId", "FinancialYear", "SellerGstin", "BuyerGstin", "InvoiceType", "EinvoiceJson")
       VALUES ($1, $2, $3, $4, $5, 'credit_note', $6::jsonb)
       RETURNING "InvoiceId", "InvoiceNo", "OrderId", "FinancialYear", "SellerGstin", "BuyerGstin", "InvoiceType", "EinvoiceJson"`,
      [invoiceNo, orderId, fy, sellerGstin, order.CustomerGstin || null, JSON.stringify({ reason, DocType: 'CRN', Val: Number(order.GrandTotal) })],
    );
    return rows[0];
  }

  /** GSTR-1: outward supplies summary (B2C + B2B + credit notes). */
  async gstr1(
    tenantDbName: string,
    financialYear: string,
  ): Promise<{
    financialYear: string;
    b2c: { taxableValue: number; cgst: number; sgst: number; igst: number; invoiceCount: number };
    b2b: { taxableValue: number; cgst: number; sgst: number; igst: number; invoiceCount: number };
    creditNotes: { taxableValue: number; cgst: number; sgst: number; igst: number; invoiceCount: number };
    totals: { taxableValue: number; cgst: number; sgst: number; igst: number };
  }> {
    const pool = this.pool(tenantDbName);
    const q = (where: string) =>
      pool.query(
        `SELECT "GstType", SUM("TaxableValue")::float8 AS "TaxableValue", SUM("Cgst")::float8 AS "Cgst",
                SUM("Sgst")::float8 AS "Sgst", SUM("Igst")::float8 AS "Igst", COUNT(*)::int AS "InvoiceCount"
         FROM "Orders" WHERE ${where} AND "Status" IN ('confirmed','delivered','shipped')
         GROUP BY "GstType"`,
      );

    const [b2cRows, b2bRows, cnRows] = await Promise.all([
      q('"CustomerGstin" IS NULL'),
      q('"CustomerGstin" IS NOT NULL'),
      pool.query(
        `SELECT SUM("TaxableValue")::float8 AS "TaxableValue", SUM("Cgst")::float8 AS "Cgst",
                SUM("Sgst")::float8 AS "Sgst", SUM("Igst")::float8 AS "Igst", COUNT(*)::int AS "InvoiceCount"
         FROM "Orders" WHERE "Status" = 'returned'`,
      ),
    ]);

    const sum = (rows: Array<{ TaxableValue: number; Cgst: number; Sgst: number; Igst: number; InvoiceCount: number }>) =>
      rows.reduce(
        (a, r) => ({
          taxableValue: a.taxableValue + Number(r.TaxableValue),
          cgst: a.cgst + Number(r.Cgst),
          sgst: a.sgst + Number(r.Sgst),
          igst: a.igst + Number(r.Igst),
          invoiceCount: a.invoiceCount + Number(r.InvoiceCount),
        }),
        { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, invoiceCount: 0 },
      );

    const b2c = sum(b2cRows.rows);
    const b2b = sum(b2bRows.rows);
    const creditNotes = sum(cnRows.rows);

    return {
      financialYear,
      b2c,
      b2b,
      creditNotes,
      totals: {
        taxableValue: b2c.taxableValue + b2b.taxableValue,
        cgst: b2c.cgst + b2b.cgst,
        sgst: b2c.sgst + b2b.sgst,
        igst: b2c.igst + b2b.igst,
      },
    };
  }

  /** GSTR-3B: monthly summary (outward + inward supplies). */
  async gstr3b(
    tenantDbName: string,
    financialYear: string,
    month: string,
  ): Promise<{
    financialYear: string;
    month: string;
    outward: { taxableValue: number; cgst: number; sgst: number; igst: number; cess: number };
    inward: { taxableValue: number; cgst: number; sgst: number; igst: number };
  }> {
    const pool = this.pool(tenantDbName);
    const where = `"CreatedOn" >= date_trunc('month', NOW()) AND "CreatedOn" < date_trunc('month', NOW()) + interval '1 month'`;

    const { rows: outward } = await pool.query(
      `SELECT SUM("TaxableValue")::float8 AS "TaxableValue", SUM("Cgst")::float8 AS "Cgst",
              SUM("Sgst")::float8 AS "Sgst", SUM("Igst")::float8 AS "Igst", SUM("Cess")::float8 AS "Cess"
       FROM "Orders" WHERE ${where} AND "Status" NOT IN ('cancelled','returned')`,
    );
    const { rows: inward } = await pool.query(
      `SELECT SUM("TaxableValue")::float8 AS "TaxableValue", SUM("Cgst")::float8 AS "Cgst",
              SUM("Sgst")::float8 AS "Sgst", SUM("Igst")::float8 AS "Igst"
       FROM "Orders" WHERE ${where} AND "Status" = 'returned'`,
    );

    const z = (r: { TaxableValue: number | null; Cgst: number | null; Sgst: number | null; Igst: number | null; Cess?: number | null }) => ({
      taxableValue: Number(r.TaxableValue ?? 0),
      cgst: Number(r.Cgst ?? 0),
      sgst: Number(r.Sgst ?? 0),
      igst: Number(r.Igst ?? 0),
      ...(r.Cess !== undefined ? { cess: Number(r.Cess ?? 0) } : {}),
    });

    return {
      financialYear,
      month,
      outward: z(outward[0] ?? {}) as { taxableValue: number; cgst: number; sgst: number; igst: number; cess: number },
      inward: z(inward[0] ?? {}) as { taxableValue: number; cgst: number; sgst: number; igst: number },
    };
  }

  /** Fetches a single invoice by id (with order + items). */
  async getInvoice(
    tenantDbName: string,
    invoiceId: string,
  ): Promise<{ invoice: InvoiceRow; order: Record<string, unknown>; items: unknown[]; tenant: Record<string, unknown> } | null> {
    const pool = this.pool(tenantDbName);
    const { rows: invoices } = await pool.query(
      `SELECT "InvoiceId", "InvoiceNo", "OrderId", "FinancialYear", "SellerGstin", "BuyerGstin", "InvoiceType", "EinvoiceJson"
       FROM "Invoices" WHERE "InvoiceId" = $1`,
      [invoiceId],
    );
    if (invoices.length === 0) return null;
    const invoice = invoices[0];

    const { rows: orders } = await pool.query(
      `SELECT "OrderNumber", "TaxableValue", "Cgst", "Sgst", "Igst", "Cess", "GrandTotal", "GstType", "CustomerGstin", "Notes"
       FROM "Orders" WHERE "OrderId" = $1`,
      [invoice.OrderId],
    );
    const { rows: items } = await pool.query(
      `SELECT "Name", "HsnCode", "GstRate", "Qty", "UnitPrice", "TaxableValue", "Cgst", "Sgst", "Igst", "Total"
       FROM "OrderItems" WHERE "OrderId" = $1`,
      [invoice.OrderId],
    );
    const { rows: tenants } = await pool.query(
      `SELECT "StoreName", "Gstin", "Address", "StateCode" FROM "TenantConfig" LIMIT 1`,
    );

    return {
      invoice,
      order: orders[0] ?? {},
      items,
      tenant: tenants[0] ?? {},
    };
  }

  /** Builds a GST tax invoice PDF (A4). */
  async renderPdf(data: NonNullable<Awaited<ReturnType<InvoiceService['getInvoice']>>>): Promise<Buffer> {
    // lazy require to keep import cost low
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const { invoice, order, items, tenant } = data;
    const fmt = (n: unknown) => Number(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

    // Header
    doc.fontSize(16).fillColor('#B8860B').text(String(tenant.StoreName ?? 'Store'), { align: 'left' });
    doc.fontSize(10).fillColor('#333').text(String(tenant.Address ?? ''));
    if (tenant.Gstin) doc.fontSize(9).fillColor('#666').text(`GSTIN: ${String(tenant.Gstin)}`);
    doc.moveDown();

    doc.fontSize(13).fillColor('#111').text('TAX INVOICE', { align: 'center' });
    doc.fontSize(9).fillColor('#666').text(`Invoice No: ${invoice.InvoiceNo}   |   Type: ${invoice.InvoiceType}`, { align: 'center' });
    doc.moveDown();

    // Bill To
    doc.fontSize(10).fillColor('#333').text(`Order: ${String(order.OrderNumber ?? '')}`);
    if (order.CustomerGstin) doc.text(`Buyer GSTIN: ${String(order.CustomerGstin)}`);
    doc.moveDown();

    // Items table
    const startY = doc.y;
    doc.fontSize(8).fillColor('#B8860B');
    doc.text('Item', 40, startY);
    doc.text('HSN', 180, startY);
    doc.text('Rate%', 230, startY);
    doc.text('Qty', 275, startY);
    doc.text('Unit', 315, startY);
    doc.text('Taxable', 365, startY);
    doc.text('GST', 425, startY);
    doc.text('Total', 480, startY);

    let y = startY + 14;
    for (const it of items as Array<{ Name: string; HsnCode: string; GstRate: string; Qty: string; UnitPrice: string; TaxableValue: string; Cgst: string; Sgst: string; Igst: string; Total: string }>) {
      doc.fontSize(8).fillColor('#333');
      doc.text(String(it.Name).slice(0, 22), 40, y);
      doc.text(String(it.HsnCode), 180, y);
      doc.text(String(it.GstRate), 230, y);
      doc.text(String(it.Qty), 275, y);
      doc.text(fmt(it.UnitPrice), 315, y);
      doc.text(fmt(it.TaxableValue), 365, y);
      doc.text(fmt(Number(it.Cgst) + Number(it.Sgst) + Number(it.Igst)), 425, y);
      doc.text(fmt(it.Total), 480, y);
      y += 14;
    }

    // Totals
    doc.moveDown();
    doc.fontSize(10).fillColor('#111');
    doc.text(`Taxable Value: ₹${fmt(order.TaxableValue ?? 0)}`);
    doc.text(`CGST: ₹${fmt(order.Cgst ?? 0)}   SGST: ₹${fmt(order.Sgst ?? 0)}   IGST: ₹${fmt(order.Igst ?? 0)}`);
    doc.fontSize(12).fillColor('#B8860B').text(`GRAND TOTAL: ₹${fmt(order.GrandTotal ?? 0)}`);
    doc.moveDown();
    if (order.Notes) doc.fontSize(9).fillColor('#666').text(`Notes: ${String(order.Notes)}`);

    doc.end();
    return done;
  }

  /** Builds GSTN e-invoice JSON (schema v1.1, B2C default). */
  buildEinvoiceJson(input: {
    invoiceNo: string;
    sellerGstin: string;
    buyerGstin: string | null;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    cess: number;
    grandTotal: number;
    buyerName: string;
    buyerState: string;
    sellerState: string;
  }): EinvoiceJson {
    const supTyp: 'B2B' | 'B2C' = input.buyerGstin ? 'B2B' : 'B2C';
    const today = new Date().toISOString().slice(0, 10);

    return {
      Version: '1.1',
      TranDtls: { SupTyp: supTyp, Igst: input.igst, Cgst: input.cgst, Sgst: input.sgst, Cess: input.cess },
      DocDtls: { Typ: 'INV', No: input.invoiceNo, Dt: today },
      SellerDtls: { Gstin: input.sellerGstin, Stcd: input.sellerState },
      BuyerDtls: {
        Gstin: input.buyerGstin || undefined,
        LglNm: input.buyerName,
        Stcd: input.buyerState,
      },
      ValDtls: {
        AssVal: input.taxableValue,
        CgstVal: input.cgst,
        SgstVal: input.sgst,
        IgstVal: input.igst,
        CessVal: input.cess,
        TotInvVal: input.grandTotal,
      },
      SellerGstin: input.sellerGstin,
      DocType: 'INV',
      Val: input.grandTotal,
    };
  }
}
