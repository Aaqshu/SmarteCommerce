import { Injectable } from '@nestjs/common';
import { TenantDbService } from '../tenancy/tenant-db.service';

export interface TaxRateRow {
  TaxRateId: string;
  HsnCode: string;
  Description?: string;
  Cgst: string;
  Sgst: string;
  Igst: string;
  Cess: string;
}

export interface TaxRateInput {
  hsnCode: string;
  description?: string;
  cgst: number;
  sgst: number;
  igst: number;
  cess?: number;
}

/**
 * Standard Indian GST rate slabs (as of 2024+):
 * exempt 0%, 0.25%, 3%, 5%, 12%, 18%, 28%
 */
const STANDARD_SLABS: Array<{ rate: number; description: string }> = [
  { rate: 0, description: 'Exempted goods' },
  { rate: 0.25, description: 'Low-rate goods (e.g. rough diamonds)' },
  { rate: 3, description: 'Gold, silver, precious stones (jewellery)' },
  { rate: 5, description: 'Essential goods' },
  { rate: 12, description: 'Standard goods' },
  { rate: 18, description: 'Most services & general goods' },
  { rate: 28, description: 'Luxury & sin goods' },
];

@Injectable()
export class HsnService {
  constructor(private tenantDb: TenantDbService) {}

  private pool(tenantDbName: string) {
    return this.tenantDb.getDb(tenantDbName);
  }

  async list(tenantDbName: string): Promise<TaxRateRow[]> {
    const { rows } = await this.pool(tenantDbName).query(
      `SELECT "TaxRateId", "HsnCode", "Description", "Cgst", "Sgst", "Igst", "Cess"
       FROM "TaxRates" ORDER BY "HsnCode" ASC`,
    );
    return rows;
  }

  async findByHsn(tenantDbName: string, hsnCode: string): Promise<TaxRateRow | null> {
    const { rows } = await this.pool(tenantDbName).query(
      `SELECT "TaxRateId", "HsnCode", "Description", "Cgst", "Sgst", "Igst", "Cess"
       FROM "TaxRates" WHERE "HsnCode" = $1`,
      [hsnCode],
    );
    return rows[0] ?? null;
  }

  async upsert(tenantDbName: string, input: TaxRateInput): Promise<TaxRateRow> {
    const { hsnCode, description = null, cgst, sgst, igst, cess = 0 } = input;
    const { rows } = await this.pool(tenantDbName).query(
      `INSERT INTO "TaxRates" ("HsnCode", "Description", "Cgst", "Sgst", "Igst", "Cess")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT ("HsnCode")
       DO UPDATE SET "Description" = EXCLUDED."Description", "Cgst" = EXCLUDED."Cgst",
                     "Sgst" = EXCLUDED."Sgst", "Igst" = EXCLUDED."Igst",
                     "Cess" = EXCLUDED."Cess", "UpdatedOn" = NOW()
       RETURNING "TaxRateId", "HsnCode", "Description", "Cgst", "Sgst", "Igst", "Cess"`,
      [hsnCode, description, cgst, sgst, igst, cess],
    );
    return rows[0];
  }

  /**
   * Seeds the 7 standard GST slabs as HSN rate codes:
   * '0000' (exempt), '0025', '0300', '0500', '1200', '1800', '2800'
   * (rate x 100, zero-padded to 4 digits).
   */
  async seedStandardRates(tenantDbName: string): Promise<void> {
    for (const slab of STANDARD_SLABS) {
      const code = String(Math.round(slab.rate * 100)).padStart(4, '0');
      await this.upsert(tenantDbName, {
        hsnCode: code,
        description: `${slab.rate}% — ${slab.description}`,
        cgst: slab.rate / 2,
        sgst: slab.rate / 2,
        igst: slab.rate,
      });
    }
  }

  /** Resolve a product's GST rate: exact HSN match, else jewellery default (3%). */
  async resolveRate(tenantDbName: string, hsnCode: string): Promise<TaxRateRow | null> {
    const exact = await this.findByHsn(tenantDbName, hsnCode);
    if (exact) return exact;

    // Jewellery/precious-metals default (HSN chapter 71) -> 3% slab '0300'
    if (hsnCode.startsWith('71')) {
      return this.findByHsn(tenantDbName, '0300');
    }
    return null;
  }
}
