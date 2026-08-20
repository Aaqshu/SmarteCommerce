import { TaxEngineService } from '../src/gst/tax-engine.service';

describe('TaxEngineService (unit — CGST/SGST/IGST)', () => {
  const engine = new TaxEngineService();

  it('splits GST into CGST+SGST for same-state (intra-state) sales', () => {
    const result = engine.calculate({
      taxableAmount: 100000,
      gstRate: 3,
      sellerState: 'UP',
      buyerState: 'UP',
    });

    expect(result.igst).toBe(0);
    expect(result.cgst).toBe(1500);
    expect(result.sgst).toBe(1500);
    expect(result.totalTax).toBe(3000);
    expect(result.grandTotal).toBe(103000);
    expect(result.type).toBe('INTRA');
  });

  it('applies full IGST for inter-state sales', () => {
    const result = engine.calculate({
      taxableAmount: 100000,
      gstRate: 3,
      sellerState: 'UP',
      buyerState: 'MH',
    });

    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(3000);
    expect(result.totalTax).toBe(3000);
    expect(result.type).toBe('INTER');
  });

  it('handles common GST rates (5%, 12%, 18%, 28%)', () => {
    for (const rate of [5, 12, 18, 28]) {
      const result = engine.calculate({
        taxableAmount: 1000,
        gstRate: rate,
        sellerState: 'UP',
        buyerState: 'UP',
      });
      expect(result.totalTax).toBe(rate * 10);
      expect(result.cgst).toBe(result.sgst);
    }
  });

  it('zero tax when rate is 0', () => {
    const result = engine.calculate({
      taxableAmount: 5000,
      gstRate: 0,
      sellerState: 'UP',
      buyerState: 'UP',
    });
    expect(result.totalTax).toBe(0);
    expect(result.grandTotal).toBe(5000);
  });

  it('rounds tax to 2 decimal places', () => {
    const result = engine.calculate({
      taxableAmount: 33333.33,
      gstRate: 3,
      sellerState: 'UP',
      buyerState: 'UP',
    });
    // 33333.33 * 3% = 999.9999 -> 1000.00
    expect(result.totalTax).toBe(1000);
    expect(result.cgst).toBe(500);
    expect(result.sgst).toBe(500);
  });
});
