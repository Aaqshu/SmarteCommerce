import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Import after mocking
const { fetchOrders, updateOrderStatus, createInvoiceForOrder } = await import('./api');

describe('Admin Orders API', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('fetchOrders', () => {
    it('maps API PascalCase to Order camelCase', async () => {
      const apiResponse = [
        {
          OrderId: 'ord_123',
          OrderNumber: 'ORD-001',
          UserId: 'user_1',
          Status: 'confirmed',
          PaymentMethod: 'razorpay',
          PaymentStatus: 'paid',
          TaxableValue: '10000.00',
          Cgst: '900.00',
          Sgst: '900.00',
          Igst: '0.00',
          GrandTotal: '11800.00',
          GstType: 'CGST+SGST',
          CustomerGstin: 'ABC123',
          Notes: 'Test order',
          CreatedOn: '2026-08-21T10:00:00Z',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const orders = await fetchOrders();

      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        orderId: 'ord_123',
        orderNumber: 'ORD-001',
        userId: 'user_1',
        status: 'confirmed',
        paymentMethod: 'razorpay',
        paymentStatus: 'paid',
        taxableValue: 1000000,
        cgst: 90000,
        sgst: 90000,
        igst: 0,
        grandTotal: 1180000,
        gstType: 'CGST+SGST',
        customerGstin: 'ABC123',
        notes: 'Test order',
        createdOn: '2026-08-21T10:00:00Z',
      });
    });

    it('passes status filter parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await fetchOrders('confirmed');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('?status=confirmed'),
        expect.any(Object)
      );
    });

    it('returns empty array on fetch error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const orders = await fetchOrders();
      expect(orders).toEqual([]);
    });
  });

  describe('updateOrderStatus', () => {
    it('sends PATCH request with status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await updateOrderStatus('ord_123', 'shipped');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/ord_123/status'),
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'shipped' }),
        })
      );
    });

    it('throws error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Bad request',
      });

      await expect(updateOrderStatus('ord_123', 'invalid')).rejects.toThrow(
        'Update order status failed'
      );
    });
  });

  describe('createInvoiceForOrder', () => {
    it('creates invoice and maps response', async () => {
      const apiResponse = {
        InvoiceId: 'inv_123',
        InvoiceNo: 'INV-2026-001',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => apiResponse,
      });

      const invoice = await createInvoiceForOrder('ord_123');

      expect(invoice).toEqual({
        invoiceId: 'inv_123',
        invoiceNo: 'INV-2026-001',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/invoices/orders/ord_123'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('throws error on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Server error',
      });

      await expect(createInvoiceForOrder('ord_123')).rejects.toThrow(
        'Create invoice failed'
      );
    });
  });
});
