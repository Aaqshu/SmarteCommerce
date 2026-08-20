import { Injectable } from '@nestjs/common';

export interface TaxCalculationInput {
  taxableAmount: number;
  gstRate: number;
  sellerState: string;
  buyerState: string;
}

export interface TaxCalculationResult {
  type: 'INTRA' | 'INTER';
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
}

/**
 * Indian GST tax engine.
 * - Intra-state (same state): GST split 50/50 into CGST + SGST
 * - Inter-state (different states): full GST as IGST
 */
@Injectable()
export class TaxEngineService {
  calculate(input: TaxCalculationInput): TaxCalculationResult {
    const { taxableAmount, gstRate, sellerState, buyerState } = input;

    const totalTax = this.round2((taxableAmount * gstRate) / 100);
    const isIntra = sellerState.trim().toUpperCase() === buyerState.trim().toUpperCase();

    if (isIntra) {
      const half = this.round2(totalTax / 2);
      return {
        type: 'INTRA',
        cgst: half,
        sgst: totalTax - half, // handle odd half-paise rounding
        igst: 0,
        totalTax,
        grandTotal: this.round2(taxableAmount + totalTax),
      };
    }

    return {
      type: 'INTER',
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      totalTax,
      grandTotal: this.round2(taxableAmount + totalTax),
    };
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }
}
