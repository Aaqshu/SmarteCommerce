import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TenantDbService } from '../tenancy/tenant-db.service';
import { TaxEngineService } from '../gst/tax-engine.service';
import { CartService } from '../cart/cart.service';

export interface OrderRow {
  OrderId: string;
  OrderNumber: string;
  TaxableValue: string;
  Cgst: string;
  Sgst: string;
  Igst: string;
  Cess: string;
  ShippingCharges: string;
  RoundOff: string;
  GrandTotal: string;
  GstType: string;
  Status: string;
}

export interface CreateOrderInput {
  userId?: string;
  phone?: string;
  email?: string;
  firstName?: string;
  paymentMethod: 'cod' | 'razorpay';
  sellerState: string;
  buyerState: string;
  customerGstin?: string;
  addressId?: string;
  notes?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private tenantDb: TenantDbService,
    private taxEngine: TaxEngineService,
    private cart: CartService,
  ) {}

  private pool(tenantDbName: string) {
    return this.tenantDb.getDb(tenantDbName);
  }

  /** Finds-or-creates a user row (guest checkout). */
  private async resolveUser(
    tenantDbName: string,
    input: CreateOrderInput,
  ): Promise<string> {
    if (input.userId) return input.userId;

    const pool = this.pool(tenantDbName);
    if (input.phone) {
      const { rows } = await pool.query(
        `SELECT "UserId" FROM "Users" WHERE "Phone" = $1`,
        [input.phone],
      );
      if (rows.length > 0) return rows[0].UserId;
      const { rows: created } = await pool.query(
        `INSERT INTO "Users" ("Phone", "FirstName", "Status")
         VALUES ($1, $2, 'active')
         RETURNING "UserId"`,
        [input.phone, input.firstName ?? null],
      );
      return created[0].UserId;
    }
    if (input.email) {
      const { rows } = await pool.query(
        `SELECT "UserId" FROM "Users" WHERE "Email" = $1`,
        [input.email],
      );
      if (rows.length > 0) return rows[0].UserId;
      const { rows: created } = await pool.query(
        `INSERT INTO "Users" ("Email", "FirstName", "Status")
         VALUES ($1, $2, 'active')
         RETURNING "UserId"`,
        [input.email, input.firstName ?? null],
      );
      return created[0].UserId;
    }
    throw new BadRequestException('userId or phone/email required');
  }

  /** Creates an order from the Redis cart, applying GST + deducting stock. */
  async createOrder(tenantDbName: string, cartId: string, input: CreateOrderInput): Promise<OrderRow> {
    const pool = this.pool(tenantDbName);
    const cart = await this.cart.getCart(cartId);

    if (cart.items.length === 0) throw new BadRequestException('Cart is empty');

    const userId = await this.resolveUser(tenantDbName, input);

    // Resolve product tax metadata
    const ids = cart.items.map((i) => i.productId);
    const { rows: products } = await pool.query(
      `SELECT "ProductId", "HsnCode", "GstRate" FROM "Products" WHERE "ProductId" = ANY($1::uuid[])`,
      [ids],
    );
    const productMap = new Map(products.map((p) => [p.ProductId, p]));

    // Line-level tax calculation + stock validation
    let taxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCess = 0;
    let grandTotal = 0;

    const lineItems: unknown[] = [];
    for (const item of cart.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new NotFoundException(`Product not found: ${item.productId}`);

      const rate = Number(product.GstRate);
      const lineTaxable = item.price * item.quantity;
      const tax = this.taxEngine.calculate({
        taxableAmount: lineTaxable,
        gstRate: rate,
        sellerState: input.sellerState,
        buyerState: input.buyerState,
      });

      taxableValue += lineTaxable;
      totalCgst += tax.cgst;
      totalSgst += tax.sgst;
      totalIgst += tax.igst;
      grandTotal += tax.grandTotal;

      lineItems.push({
        productId: item.productId,
        name: item.name,
        hsnCode: product.HsnCode,
        gstRate: rate,
        qty: item.quantity,
        unitPrice: item.price,
        taxableValue: lineTaxable,
        cgst: tax.cgst,
        sgst: tax.sgst,
        igst: tax.igst,
        cess: 0,
        total: tax.grandTotal,
      });
    }

    // Order number: ORD-YYYYMMDD-#### (random suffix)
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderNumber = `ORD-${datePart}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { rows } = await pool.query(
      `INSERT INTO "Orders"
        ("OrderNumber", "UserId", "AddressId", "Status", "PaymentMethod", "PaymentStatus",
         "TaxableValue", "Cgst", "Sgst", "Igst", "Cess", "ShippingCharges", "RoundOff", "GrandTotal",
         "GstType", "CustomerGstin", "Notes")
       VALUES ($1, $2, $3, 'confirmed', $4,
               CASE WHEN $4 = 'cod' THEN 'unpaid' ELSE 'unpaid' END,
               $5, $6, $7, $8, $9, 0, 0, $10, $11, $12, $13)
       RETURNING "OrderId", "OrderNumber", "TaxableValue", "Cgst", "Sgst", "Igst", "Cess",
                 "ShippingCharges", "RoundOff", "GrandTotal", "GstType", "Status"`,
      [
        orderNumber,
        userId,
        input.addressId ?? null,
        input.paymentMethod,
        taxableValue,
        totalCgst,
        totalSgst,
        totalIgst,
        totalCess,
        grandTotal,
        totalIgst > 0 ? 'inter' : 'intra',
        input.customerGstin ?? null,
        input.notes ?? null,
      ],
    );
    const order = rows[0];

    // Insert line items
    for (const li of lineItems as Array<{
      productId: string; name: string; hsnCode: string; gstRate: number; qty: number;
      unitPrice: number; taxableValue: number; cgst: number; sgst: number; igst: number; cess: number; total: number;
    }>) {
      await pool.query(
        `INSERT INTO "OrderItems" ("OrderId", "ProductId", "Name", "HsnCode", "GstRate", "Qty",
          "UnitPrice", "TaxableValue", "Cgst", "Sgst", "Igst", "Cess", "Total")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [order.OrderId, li.productId, li.name, li.hsnCode, li.gstRate, li.qty,
         li.unitPrice, li.taxableValue, li.cgst, li.sgst, li.igst, li.cess, li.total],
      );
    }

    // Deduct stock via inventory issue (throws if insufficient)
    for (const li of lineItems as Array<{ productId: string; qty: number }>) {
      await this.deductStock(tenantDbName, li.productId, li.qty);
    }

    // Clear the cart
    await this.cart.clearCart(cartId);

    return order;
  }

  private async deductStock(tenantDbName: string, productId: string, quantity: number): Promise<void> {
    const pool = this.pool(tenantDbName);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT "Quantity" FROM "StockItems" WHERE "ProductId" = $1 FOR UPDATE`,
        [productId],
      );
      if (rows.length === 0) throw new BadRequestException('No stock record for product');
      const available = Number(rows[0].Quantity);
      if (available < quantity) {
        throw new BadRequestException(`Insufficient stock: have ${available}, need ${quantity}`);
      }
      await client.query(
        `UPDATE "StockItems" SET "Quantity" = "Quantity" - $2, "UpdatedOn" = NOW() WHERE "ProductId" = $1`,
        [productId, quantity],
      );
      await client.query(
        `INSERT INTO "StockMovements" ("ProductId", "Type", "Quantity")
         VALUES ($1, 'sales_issue', $2)`,
        [productId, quantity],
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /** Lists orders for a user. */
  async listOrders(tenantDbName: string, userId: string): Promise<OrderRow[]> {
    const { rows } = await this.pool(tenantDbName).query(
      `SELECT "OrderId", "OrderNumber", "Status", "PaymentMethod", "PaymentStatus",
              "GrandTotal", "GstType", "CreatedOn"
       FROM "Orders" WHERE "UserId" = $1 ORDER BY "CreatedOn" DESC`,
      [userId],
    );
    return rows;
  }

  /** Lists ALL orders (admin) with optional status filter. */
  async listAllOrders(tenantDbName: string, status?: string): Promise<OrderRow[]> {
    const pool = this.pool(tenantDbName);
    const where = status ? `WHERE "Status" = $1` : '';
    const params = status ? [status] : [];
    const { rows } = await pool.query(
      `SELECT "OrderId", "OrderNumber", "UserId", "Status", "PaymentMethod", "PaymentStatus",
              "TaxableValue", "Cgst", "Sgst", "Igst", "GrandTotal", "GstType", "CustomerGstin",
              "Notes", "CreatedOn"
       FROM "Orders" ${where} ORDER BY "CreatedOn" DESC LIMIT 200`,
      params,
    );
    return rows;
  }

  /** Updates an order's status (admin). */
  async updateOrderStatus(tenantDbName: string, orderId: string, status: string): Promise<OrderRow> {
    const { rows } = await this.pool(tenantDbName).query(
      `UPDATE "Orders" SET "Status" = $2, "UpdatedOn" = NOW()
       WHERE "OrderId" = $1
       RETURNING "OrderId", "OrderNumber", "Status", "PaymentMethod", "PaymentStatus", "GrandTotal", "GstType"`,
      [orderId, status],
    );
    if (rows.length === 0) throw new NotFoundException('Order not found');
    return rows[0];
  }
}
