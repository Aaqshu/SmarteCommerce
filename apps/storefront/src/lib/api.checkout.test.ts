import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
const { createCart, placeOrder } = await import('./api');

describe('Checkout API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('createCart', () => {
    it('posts each cart item sequentially', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) });

      await createCart('browser-123', [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ]);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('/cart/browser-123/items'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: 'prod-1', quantity: 2 }),
        })
      );
      expect(mockFetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/cart/browser-123/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ productId: 'prod-2', quantity: 1 }),
        })
      );
    });

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid product',
      });

      await expect(
        createCart('browser-123', [{ productId: 'invalid', quantity: 1 }])
      ).rejects.toThrow();
    });

    it('handles empty cart gracefully', async () => {
      await createCart('browser-123', []);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('placeOrder', () => {
    it('maps PascalCase response to camelCase', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          OrderNumber: 'AUR-123456',
          GrandTotal: '8500.00',
        }),
      });

      const result = await placeOrder('browser-123', {
        phone: '+917007794906',
        firstName: 'Anas',
        paymentMethod: 'cod',
        sellerState: 'UP',
        buyerState: 'UP',
      });

      expect(result).toEqual({
        orderNumber: 'AUR-123456',
        grandTotal: 850000, // 8500.00 rupees → 850000 paise
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/browser-123'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '+917007794906',
            firstName: 'Anas',
            paymentMethod: 'cod',
            sellerState: 'UP',
            buyerState: 'UP',
          }),
        })
      );
    });

    it('includes optional fields when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          OrderNumber: 'AUR-789012',
          GrandTotal: '12000.00',
        }),
      });

      await placeOrder('browser-456', {
        phone: '+919876543210',
        firstName: 'John',
        paymentMethod: 'razorpay',
        sellerState: 'MH',
        buyerState: 'MH',
        customerGstin: '27ABCDE1234F1Z5',
        notes: 'Urgent delivery',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: JSON.stringify({
            phone: '+919876543210',
            firstName: 'John',
            paymentMethod: 'razorpay',
            sellerState: 'MH',
            buyerState: 'MH',
            customerGstin: '27ABCDE1234F1Z5',
            notes: 'Urgent delivery',
          }),
        })
      );
    });

    it('falls back to local order on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await placeOrder('browser-123', {
        phone: '+917007794906',
        firstName: 'Anas',
        paymentMethod: 'cod',
        sellerState: 'UP',
        buyerState: 'UP',
      });

      expect(result.orderNumber).toMatch(/^LOCAL-\d{6}$/);
      expect(result.grandTotal).toBe(0);
    });

    it('falls back to local order on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const result = await placeOrder('browser-123', {
        phone: '+917007794906',
        firstName: 'Anas',
        paymentMethod: 'cod',
        sellerState: 'UP',
        buyerState: 'UP',
      });

      expect(result.orderNumber).toMatch(/^LOCAL-\d{6}$/);
      expect(result.grandTotal).toBe(0);
    });
  });
});
