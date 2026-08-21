import { Test } from '@nestjs/testing';
import { OrdersService } from '../src/orders/orders.service';
import { TaxEngineService } from '../src/gst/tax-engine.service';
import { CartService } from '../src/cart/cart.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('OrdersService (unit, mocked deps)', () => {
  let service: OrdersService;
  let mockPool: { query: jest.Mock; connect: jest.Mock };
  let mockClient: { query: jest.Mock; release: jest.Mock };
  let mockRedis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

  const mockTenantDb = { getDb: jest.fn() };

  beforeEach(async () => {
    mockClient = { query: jest.fn(), release: jest.fn() };
    mockPool = { query: jest.fn(), connect: jest.fn().mockResolvedValue(mockClient) };
    mockTenantDb.getDb.mockReturnValue(mockPool);
    mockRedis = { get: jest.fn(), set: jest.fn(async () => 'OK'), del: jest.fn(async () => 1) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        TaxEngineService,
        CartService,
        { provide: TenantDbService, useValue: mockTenantDb },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it('creates an order from cart with intra-state GST split', async () => {
    // cart with 1 item
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify([{ productId: 'p1', quantity: 2, price: 85000, name: 'Zainab Ring' }]),
    );
    // product lookup (for HSN + stock)
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ProductId: 'p1', HsnCode: '7113', GstRate: '3.00' }],
    });
    // insert order (2nd pool query)
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        OrderId: 'o1',
        OrderNumber: 'ORD-1001',
        TaxableValue: '170000.00',
        Cgst: '2550.00',
        Sgst: '2550.00',
        Igst: '0',
        GrandTotal: '175100.00',
        GstType: 'intra',
        Status: 'confirmed',
      }],
    });
    // insert order items
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // stock deduction (issue) — client: BEGIN, SELECT FOR UPDATE, UPDATE, INSERT, COMMIT
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [{ Quantity: '10' }] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const order = await service.createOrder('tenant_demo', 'cart-1', {
      userId: 'u1',
      paymentMethod: 'cod',
      sellerState: 'UP',
      buyerState: 'UP',
    });

    expect(order.OrderNumber).toBe('ORD-1001');
    expect(order.GstType).toBe('intra');
    expect(order.Cgst).toBe('2550.00'); // 170000 * 3% / 2
    expect(order.Sgst).toBe('2550.00');
    expect(order.GrandTotal).toBe('175100.00');
    // cart cleared after order
    expect(mockRedis.del).toHaveBeenCalledWith('cart:cart-1');
  });

  it('creates an order with IGST for inter-state sale', async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify([{ productId: 'p1', quantity: 1, price: 100000, name: 'Ring' }]),
    );
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ProductId: 'p1', HsnCode: '7113', GstRate: '3.00' }],
    });
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        OrderId: 'o2', OrderNumber: 'ORD-1002', TaxableValue: '100000.00',
        Cgst: '0', Sgst: '0', Igst: '3000.00', GrandTotal: '103000.00',
        GstType: 'inter', Status: 'confirmed',
      }],
    });
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [{ Quantity: '5' }] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const order = await service.createOrder('tenant_demo', 'cart-2', {
      userId: 'u2',
      paymentMethod: 'razorpay',
      sellerState: 'UP',
      buyerState: 'MH',
    });

    expect(order.GstType).toBe('inter');
    expect(order.Igst).toBe('3000.00');
    expect(order.Cgst).toBe('0');
  });

  it('rejects when cart is empty', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    await expect(
      service.createOrder('tenant_demo', 'empty-cart', {
        userId: 'u1',
        paymentMethod: 'cod',
        sellerState: 'UP',
        buyerState: 'UP',
      }),
    ).rejects.toThrow('Cart is empty');
  });

  it('rejects when stock insufficient', async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify([{ productId: 'p1', quantity: 5, price: 100, name: 'Ring' }]),
    );
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ProductId: 'p1', HsnCode: '7113', GstRate: '3.00' }],
    });
    // INSERT order happens before deductStock (which throws)
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        OrderId: 'o3', OrderNumber: 'ORD-1003', TaxableValue: '500.00',
        Cgst: '7.50', Sgst: '7.50', Igst: '0', GrandTotal: '515.00',
        GstType: 'intra', Status: 'confirmed',
      }],
    });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [{ Quantity: '2' }] });

    await expect(
      service.createOrder('tenant_demo', 'cart-3', {
        userId: 'u1',
        paymentMethod: 'cod',
        sellerState: 'UP',
        buyerState: 'UP',
      }),
    ).rejects.toThrow('Insufficient stock');
  });

  it('creates a guest order by phone (auto user upsert)', async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify([{ productId: 'p1', quantity: 1, price: 85000, name: 'Zainab Ring' }]),
    );
    // user lookup by phone → not found
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // user insert
    mockPool.query.mockResolvedValueOnce({ rows: [{ UserId: 'gu-1' }] });
    // product lookup
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ProductId: 'p1', HsnCode: '7113', GstRate: '3.00' }],
    });
    // insert order
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        OrderId: 'o4', OrderNumber: 'ORD-1004', TaxableValue: '85000.00',
        Cgst: '1275.00', Sgst: '1275.00', Igst: '0', GrandTotal: '87550.00',
        GstType: 'intra', Status: 'confirmed',
      }],
    });
    // insert order item
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    // deduct stock (client): BEGIN, SELECT, UPDATE, INSERT, COMMIT
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [{ Quantity: '10' }] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });
    mockClient.query.mockResolvedValueOnce({ rows: [] });

    const order = await service.createOrder('tenant_demo', 'cart-4', {
      phone: '7007794906',
      firstName: 'Anas',
      paymentMethod: 'cod',
      sellerState: 'UP',
      buyerState: 'UP',
    });

    expect(order.OrderNumber).toBe('ORD-1004');
    expect(mockRedis.del).toHaveBeenCalled();
  });
});
