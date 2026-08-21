import { Test } from '@nestjs/testing';
import { PaymentsService } from '../src/payments/payments.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('PaymentsService (unit, mocked razorpay + pool)', () => {
  let service: PaymentsService;
  let mockPool: { query: jest.Mock };
  let mockRazorpay: { orders: { create: jest.Mock }; payments: { fetch: jest.Mock } };

  const mockTenantDb = { getDb: jest.fn() };

  beforeEach(async () => {
    mockPool = { query: jest.fn() };
    mockTenantDb.getDb.mockReturnValue(mockPool);
    mockRazorpay = {
      orders: { create: jest.fn() },
      payments: { fetch: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: TenantDbService, useValue: mockTenantDb },
        { provide: 'RAZORPAY_CLIENT', useValue: mockRazorpay },
      ],
    }).compile();

    service = moduleRef.get(PaymentsService);
  });

  it('creates a Razorpay order (₹ -> paise, 2 decimals)', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        OrderId: 'o1',
        OrderNumber: 'ORD-1001',
        GrandTotal: '87550.00',
        Status: 'confirmed',
      }],
    });
    mockRazorpay.orders.create.mockResolvedValueOnce({
      id: 'order_P1x2y3',
      amount: 8755000,
      currency: 'INR',
    });

    const result = await service.createPaymentOrder('tenant_demo', 'o1');

    expect(mockRazorpay.orders.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 8755000, // ₹87550 * 100
        currency: 'INR',
        receipt: 'ORD-1001',
      }),
    );
    expect(result.razorpayOrderId).toBe('order_P1x2y3');
  });

  it('rejects payment order for unpaid/cancelled orders', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ OrderId: 'o2', Status: 'cancelled' }],
    });

    await expect(service.createPaymentOrder('tenant_demo', 'o2')).rejects.toThrow(
      'Order is not in a payable state',
    );
  });

  it('verifies a Razorpay webhook signature (HMAC-SHA256)', () => {
    // Known values: compute expected signature for body "test-payload" with secret "secret123"
    const body = 'test-payload';
    const secret = 'secret123';
    const crypto = require('crypto');
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

    expect(service.verifyWebhookSignature(body, expected, secret)).toBe(true);
    expect(
      service.verifyWebhookSignature(body, 'f'.repeat(64), secret),
    ).toBe(false);
  });

  it('marks order paid on payment.captured webhook', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ OrderId: 'o1', PaymentStatus: 'unpaid' }] });
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // update

    await service.handleWebhook('tenant_demo', 'payment.captured', {
      payload: {
        payment: { entity: { order_id: 'order_P1x2y3', id: 'pay_1' } },
        order: { entity: { receipt: 'ORD-1001' } },
      },
    });

    expect(mockPool.query.mock.calls[1][0]).toContain('UPDATE "Orders"');
    expect(mockPool.query.mock.calls[1][0]).toContain("'paid'");
  });
});
