import { describe, it, expect } from 'vitest';
import { formatINR, calculateGST, cn } from './utils';

describe('formatINR', () => {
  it('formats price in paise to INR correctly', () => {
    expect(formatINR(8500000)).toBe('₹85,000');
    expect(formatINR(15000000)).toBe('₹1,50,000');
    expect(formatINR(100000)).toBe('₹1,000');
    expect(formatINR(0)).toBe('₹0');
  });

  it('handles large amounts', () => {
    expect(formatINR(100000000)).toBe('₹10,00,000');
  });
});

describe('calculateGST', () => {
  it('calculates GST breakdown correctly for 3% rate', () => {
    const result = calculateGST(8500000, 3);
    expect(result.total).toBe(8500000);
    expect(result.taxableValue).toBeLessThan(result.total);
    expect(result.gstAmount).toBeGreaterThan(0);
    expect(result.taxableValue + result.gstAmount).toBe(result.total);
  });

  it('calculates GST breakdown correctly for 18% rate', () => {
    const result = calculateGST(11800, 18);
    expect(result.total).toBe(11800);
    expect(result.taxableValue).toBe(10000);
    expect(result.gstAmount).toBe(1800);
  });

  it('handles zero price', () => {
    const result = calculateGST(0, 3);
    expect(result.total).toBe(0);
    expect(result.taxableValue).toBe(0);
    expect(result.gstAmount).toBe(0);
  });
});

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('handles tailwind merge conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});
