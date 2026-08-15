import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format price in INR (paise to rupees)
 * @param priceInPaise - Price in paise (1 rupee = 100 paise)
 * @returns Formatted price string like "₹85,000"
 */
export function formatINR(priceInPaise: number): string {
  const rupees = priceInPaise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Calculate GST breakdown
 */
export function calculateGST(priceInPaise: number, gstRate: number): {
  taxableValue: number;
  gstAmount: number;
  total: number;
} {
  const taxableValue = Math.round(priceInPaise / (1 + gstRate / 100));
  const gstAmount = priceInPaise - taxableValue;
  return {
    taxableValue,
    gstAmount,
    total: priceInPaise,
  };
}
