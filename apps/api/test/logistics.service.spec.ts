import { Test } from '@nestjs/testing';
import { LogisticsService } from '../src/logistics/logistics.service';
import { TenantDbService } from '../src/tenancy/tenant-db.service';

describe('LogisticsService (unit, mocked HTTP)', () => {
  let service: LogisticsService;
  let mockPool: { query: jest.Mock };
  let mockHttp: { post: jest.Mock; get: jest.Mock };

  const mockTenantDb = { getDb: jest.fn() };

  beforeEach(async () => {
    mockPool = { query: jest.fn() };
    mockTenantDb.getDb.mockReturnValue(mockPool);
    mockHttp = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        LogisticsService,
        { provide: TenantDbService, useValue: mockTenantDb },
        { provide: 'SHIPROCKET_HTTP', useValue: mockHttp },
        { provide: 'SHIPROCKET_EMAIL', useValue: 'test@zainab.in' },
        { provide: 'SHIPROCKET_PASSWORD', useValue: 'test-pass' },
      ],
    }).compile();

    service = moduleRef.get(LogisticsService);
  });

  it('logs in and caches the JWT token', async () => {
    mockHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-abc' } });

    const token = await service.getToken();

    expect(token).toBe('jwt-abc');
    expect(mockHttp.post).toHaveBeenCalledWith(
      'https://apiv2.shiprocket.in/v1/external/auth/login',
      { email: 'test@zainab.in', password: 'test-pass' },
    );
  });

  it('throws a clear error when Shiprocket credentials are missing', async () => {
    const bare = new LogisticsService(mockTenantDb as never, mockHttp as never, '', '');
    await expect(bare.getToken()).rejects.toThrow('SHIPROCKET_EMAIL');
  });

  it('creates an adhoc shipment and returns the shipment id', async () => {
    mockHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-abc' } });
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        OrderId: 'o1',
        OrderNumber: 'ORD-1001',
        GrandTotal: '87550.00',
        PaymentMethod: 'cod',
        Status: 'confirmed',
      }],
    });
    mockPool.query.mockResolvedValueOnce({
      rows: [{
        Name: 'Zainab 22K Gold Ring',
        Qty: 1,
        UnitPrice: '85000.00',
        HsnCode: '7113',
      }],
    });
    mockHttp.post.mockResolvedValueOnce({ data: { order_id: 123456, shipment_id: 654321 } });

    const result = await service.createShipment('tenant_demo', 'o1', {
      name: 'Anas Sheikh',
      phone: '7007794906',
      address: 'Ali Colony, Thakuganj',
      city: 'Lucknow',
      state: 'UP',
      pincode: '226003',
    });

    expect(result.shipmentId).toBe(654321);
    expect(mockHttp.post).toHaveBeenCalledTimes(2);
    // 2nd call = create order adhoc
    expect(mockHttp.post.mock.calls[1][0]).toContain('orders/create/adhoc');
    expect(mockHttp.post.mock.calls[1][1]).toMatchObject({
      order_id: 'ORD-1001',
      order_date: expect.any(String),
      pickup_location: 'primary',
      billing_customer_name: 'Anas Sheikh',
      billing_address: 'Ali Colony, Thakuganj',
      billing_city: 'Lucknow',
      billing_state: 'UP',
      billing_pincode: '226003',
      billing_phone: '7007794906',
      payment_method: 'COD',
    });
  });

  it('generates an AWB for a shipment', async () => {
    mockHttp.post.mockResolvedValueOnce({ data: { token: 'jwt-abc' } });
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ShipmentId: '654321', OrderId: 'o1' }],
    });
    mockHttp.post.mockResolvedValueOnce({
      data: { awb_assign_status: true, response: { data: { awb_code: '123456789012' } } },
    });
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // update shipment row

    const awb = await service.generateAwb('tenant_demo', '654321');

    expect(awb).toBe('123456789012');
    expect(mockPool.query.mock.calls[1][0]).toContain('UPDATE "Shipments"');
  });

  it('updates order status from tracking webhook', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [{ OrderId: 'o1', Status: 'confirmed' }],
    });
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // update order status
    mockPool.query.mockResolvedValueOnce({
      rows: [{ ShipmentId: 's1' }],
    }); // shipment lookup
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // event insert
    mockPool.query.mockResolvedValueOnce({ rows: [] }); // shipment status update

    await service.handleTrackingUpdate('tenant_demo', 'ORD-1001', 'DELIVERED', 'Delivered to customer');

    expect(mockPool.query.mock.calls[1][0]).toContain('UPDATE "Orders"');
    expect(mockPool.query.mock.calls[1][1]).toEqual(['o1', 'delivered']);
  });
});
