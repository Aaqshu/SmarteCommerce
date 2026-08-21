import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantDbService } from '../tenancy/tenant-db.service';

const API_BASE = 'https://apiv2.shiprocket.in/v1/external';

export interface HttpLike {
  post: (url: string, body: unknown, opts?: Record<string, unknown>) => Promise<{ data: Record<string, unknown> }>;
}

export interface ShipmentAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const STATUS_MAP: Record<string, string> = {
  PICKED: 'picked',
  IN_TRANSIT: 'in_transit',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  RTO: 'rto',
  RTO_DELIVERED: 'rto',
};

@Injectable()
export class LogisticsService {
  private token: string | null = null;
  private tokenExpiry = 0;

  constructor(
    private tenantDb: TenantDbService,
    @Inject('SHIPROCKET_HTTP') private http: HttpLike,
    @Inject('SHIPROCKET_EMAIL') private email: string,
    @Inject('SHIPROCKET_PASSWORD') private password: string,
  ) {}

  private pool(tenantDbName: string) {
    return this.tenantDb.getDb(tenantDbName);
  }

  /** Logs in to Shiprocket and caches the JWT (token valid ~24h). */
  async getToken(): Promise<string> {
    if (!this.email || !this.password) {
      throw new BadRequestException('SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD not configured');
    }
    if (this.token && Date.now() < this.tokenExpiry) return this.token;

    const { data } = await this.http.post(`${API_BASE}/auth/login`, {
      email: this.email,
      password: this.password,
    });
    this.token = String(data.token);
    this.tokenExpiry = Date.now() + 22 * 60 * 60 * 1000; // refresh before 24h
    return this.token!;
  }

  /** Creates a Shiprocket adhoc order + shipment for a confirmed order. */
  async createShipment(
    tenantDbName: string,
    orderId: string,
    address: ShipmentAddress,
  ): Promise<{ shipmentId: number; orderId: string }> {
    const token = await this.getToken();
    const pool = this.pool(tenantDbName);

    const { rows: orders } = await pool.query(
      `SELECT "OrderId", "OrderNumber", "GrandTotal", "PaymentMethod", "Status"
       FROM "Orders" WHERE "OrderId" = $1`,
      [orderId],
    );
    if (orders.length === 0) throw new NotFoundException('Order not found');
    const order = orders[0];
    if (order.Status === 'cancelled') throw new BadRequestException('Cannot ship a cancelled order');

    const { rows: items } = await pool.query(
      `SELECT "Name", "Qty", "UnitPrice", "HsnCode" FROM "OrderItems" WHERE "OrderId" = $1`,
      [orderId],
    );

    const { data } = await this.http.post(
      `${API_BASE}/orders/create/adhoc`,
      {
        order_id: order.OrderNumber,
        order_date: new Date().toISOString().slice(0, 10),
        pickup_location: 'primary',
        channel_id: '',
        comment: 'Order via Zainab Jewellers',
        billing_customer_name: address.name,
        billing_last_name: '',
        billing_address: address.address,
        billing_address_2: '',
        billing_city: address.city,
        billing_pincode: address.pincode,
        billing_state: address.state,
        billing_country: 'India',
        billing_email: '',
        billing_phone: address.phone,
        shipping_is_billing: true,
        order_items: items.map((i) => ({
          name: i.Name,
          sku: i.HsnCode,
          units: Number(i.Qty),
          selling_price: Number(i.UnitPrice),
        })),
        payment_method: order.PaymentMethod === 'cod' ? 'COD' : 'Prepaid',
        sub_total: Number(order.GrandTotal),
        length: 10,
        breadth: 10,
        height: 10,
        weight: 0.5,
      },
      { headers: { Authorization: `Bearer ${token}` } },
    );

    const shipmentId = Number((data as { shipment_id?: number }).shipment_id);
    const shiprocketId = Number((data as { order_id?: number }).order_id);

    await pool.query(
      `INSERT INTO "Shipments" ("OrderId", "ShiprocketId", "Status")
       VALUES ($1, $2, 'created')`,
      [orderId, shiprocketId],
    );

    return { shipmentId, orderId };
  }

  /** Generates an AWB for a created shipment and persists it. */
  async generateAwb(tenantDbName: string, shipmentId: string): Promise<string> {
    const token = await this.getToken();
    const pool = this.pool(tenantDbName);

    const { rows: shipments } = await pool.query(
      `SELECT "ShipmentId", "OrderId", "ShiprocketId" FROM "Shipments" WHERE "ShipmentId" = $1`,
      [shipmentId],
    );
    if (shipments.length === 0) throw new NotFoundException('Shipment not found');

    const { data } = await this.http.post(
      `${API_BASE}/courier/generate/awb`,
      { shipment_id: Number(shipments[0].ShiprocketId) },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const awbCode = String(
      (data.response as { data?: { awb_code?: string } })?.data?.awb_code ?? '',
    );
    if (!awbCode) throw new BadRequestException('AWB generation failed');

    await pool.query(
      `UPDATE "Shipments" SET "AwbNumber" = $2, "Status" = 'awb_generated', "UpdatedOn" = NOW()
       WHERE "ShipmentId" = $1`,
      [shipmentId, awbCode],
    );
    return awbCode;
  }

  /** Maps a Shiprocket tracking status to our order status and persists. */
  async handleTrackingUpdate(
    tenantDbName: string,
    orderNumber: string,
    shiprocketStatus: string,
    description: string,
  ): Promise<void> {
    const pool = this.pool(tenantDbName);
    const mapped = STATUS_MAP[String(shiprocketStatus).toUpperCase()] ?? 'in_transit';

    const { rows: orders } = await pool.query(
      `SELECT "OrderId", "Status" FROM "Orders" WHERE "OrderNumber" = $1`,
      [orderNumber],
    );
    if (orders.length === 0) return;

    await pool.query(
      `UPDATE "Orders" SET "Status" = $2, "UpdatedOn" = NOW() WHERE "OrderId" = $1`,
      [orders[0].OrderId, mapped],
    );

    const { rows: shipments } = await pool.query(
      `SELECT "ShipmentId" FROM "Shipments" WHERE "OrderId" = $1`,
      [orders[0].OrderId],
    );
    if (shipments.length > 0) {
      await pool.query(
        `INSERT INTO "ShipmentEvents" ("ShipmentId", "Status", "Description")
         VALUES ($1, $2, $3)`,
        [shipments[0].ShipmentId, mapped, description],
      );
      await pool.query(
        `UPDATE "Shipments" SET "Status" = $2, "UpdatedOn" = NOW() WHERE "ShipmentId" = $1`,
        [shipments[0].ShipmentId, mapped],
      );
    }
  }
}
