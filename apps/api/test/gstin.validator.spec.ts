import { GstinValidator } from '../src/gst/gstin.validator';

describe('GstinValidator (free format + checksum validation)', () => {
  const v = new GstinValidator();

  it('accepts a valid 15-char GSTIN', () => {
    // 27 = state code (Maharashtra), ABCDE1234F = PAN, 1 = entity, Z = default, 0 = checksum
    expect(v.isValid('27ABCDE1234F1Z0')).toBe(true);
  });

  it('rejects wrong length', () => {
    expect(v.isValid('27ABCDE1234F1Z')).toBe(false);
    expect(v.isValid('27ABCDE1234F1Z55')).toBe(false);
  });

  it('rejects lowercase (GSTIN must be uppercase)', () => {
    expect(v.isValid('27abcde1234f1z5')).toBe(false);
  });

  it('rejects invalid state code (first 2 digits)', () => {
    expect(v.isValid('99ABCDE1234F1Z5')).toBe(false);
  });

  it('rejects invalid PAN structure (position 3-12)', () => {
    expect(v.isValid('27ABCDE123451Z5')).toBe(false); // digit in PAN position
  });

  it('rejects invalid entity code (position 13)', () => {
    expect(v.isValid('27ABCDE1234FXZ5')).toBe(false); // X invalid entity code
  });

  it('rejects invalid checksum (last char)', () => {
    expect(v.isValid('27ABCDE1234F1Z9')).toBe(false);
  });

  it('rejects empty/null', () => {
    expect(v.isValid('')).toBe(false);
    expect(v.isValid(null as unknown as string)).toBe(false);
  });
});
