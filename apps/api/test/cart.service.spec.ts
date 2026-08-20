import { Test } from '@nestjs/testing';
import { CartService } from '../src/cart/cart.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('CartService (unit, mocked redis + db)', () => {
  let service: CartService;
  let mockRedis: { get: jest.Mock; set: jest.Mock; del: jest.Mock };
  let mockPool: { query: jest.Mock };

  const mockTenantDb = { getDb: jest.fn() };

  beforeEach(async () => {
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(async () => 'OK'),
      del: jest.fn(async () => 1),
    };
    mockPool = { query: jest.fn() };
    mockTenantDb.getDb.mockReturnValue(mockPool);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: TenantDbService, useValue: mockTenantDb },
        { provide: 'REDIS_CLIENT', useValue: mockRedis },
      ],
    }).compile();

    service = moduleRef.get(CartService);
  });

  it('returns empty cart when nothing stored', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    const cart = await service.getCart('cart-1');
    expect(cart).toEqual({ items: [], totalItems: 0, subtotal: 0 });
  });

  it('adds an item to the cart', async () => {
    mockRedis.get.mockResolvedValueOnce(null); // empty cart
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ProductId: 'p1', SellingPrice: '100.00', Name: 'Ring' }],
    }); // product lookup
    mockPool.query.mockResolvedValueOnce({ rows: [{ Quantity: '100' }] }); // stock check

    const cart = await service.addItem('tenant_demo', 'cart-1', 'p1', 2);

    expect(cart.items).toEqual([
      { productId: 'p1', quantity: 2, price: 100, name: 'Ring' },
    ]);
    expect(cart.totalItems).toBe(2);
    expect(cart.subtotal).toBe(200);
    expect(mockRedis.set).toHaveBeenCalled();
  });

  it('increments quantity when adding same product again', async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify([{ productId: 'p1', quantity: 1, price: 100, name: 'Ring' }]),
    );
    mockPool.query.mockResolvedValueOnce({ rows: [{ Quantity: '100' }] }); // stock check

    const cart = await service.addItem('tenant_demo', 'cart-1', 'p1', 1);
    expect(cart.items[0].quantity).toBe(2);
    expect(cart.totalItems).toBe(2);
  });

  it('throws when adding an unknown product', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // no product

    await expect(service.addItem('tenant_demo', 'cart-1', 'ghost', 1)).rejects.toThrow('Product not found');
  });

  it('updates quantity', async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify([{ productId: 'p1', quantity: 1, price: 100, name: 'Ring' }]),
    );

    const cart = await service.updateQuantity('cart-1', 'p1', 5);
    expect(cart.items[0].quantity).toBe(5);
    expect(cart.totalItems).toBe(5);
  });

  it('removes an item', async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify([
        { productId: 'p1', quantity: 1, price: 100, name: 'Ring' },
        { productId: 'p2', quantity: 2, price: 50, name: 'Bangle' },
      ]),
    );

    const cart = await service.removeItem('cart-1', 'p1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].productId).toBe('p2');
  });

  it('clears the cart', async () => {
    await service.clearCart('cart-1');
    expect(mockRedis.del).toHaveBeenCalledWith('cart:cart-1');
  });

  it('rejects quantity over available stock', async () => {
    mockRedis.get.mockResolvedValueOnce(null);
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ProductId: 'p1', SellingPrice: '100.00', Name: 'Ring' }],
    });
    mockPool.query.mockResolvedValueOnce({ rows: [{ Quantity: '5' }] }); // stock check

    await expect(service.addItem('tenant_demo', 'cart-1', 'p1', 10)).rejects.toThrow('Only 5 available');
  });
});
