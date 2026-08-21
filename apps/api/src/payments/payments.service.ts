import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { TenantDbService } from '../tenancy/tenant-db.service';

export interface RazorpayClient {
  orders: { create: (opts: Record<string, unknown>) => Promise<{ id: string }> };
}

@Injectable()
export class PaymentsService {
  constructor(
    private tenantDb: TenantDbService,
    @Inject('RAZORPAY_CLIENT') private razorpay: RazorpayClient,
  ) {}

  private pool(tenantDbName: string) {
    return this.tenantDb.getDb(tenantDbName);
  }

  /** Creates a Razorpay order for a confirmed order (₹ → paise). */
  async createPaymentOrder(tenantDbName: string, orderId: string): Promise<{ razorpayOrderId: string }> {
    const { rows } = await this.pool(tenantDbName).query(
      `SELECT "OrderId", "OrderNumber", "GrandTotal", "Status"
       FROM "Orders" WHERE "OrderId" = $1`,
      [orderId],
    );
    if (rows.length === 0) throw new NotFoundException('Order not found');
    const order = rows[0];
    if (order.Status !== 'confirmed' && order.Status !== 'pending') {
      throw new BadRequestException('Order is not in a payable state');
    }

    const amountPaise = Math.round(Number(order.GrandTotal) * 100);
    const rzp = await this.razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.OrderNumber,
      notes: { orderId },
    });

    await this.pool(tenantDbName).query(
      `UPDATE "Orders" SET "RazorpayOrderId" = $2, "UpdatedOn" = NOW() WHERE "OrderId" = $1`,
      [orderId, rzp.id],
    );

    return { razorpayOrderId: rzp.id };
  }

  /** Verifies a Razorpay webhook signature (x-razorpay-signature). */
  verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  }

  /** Handles payment.captured / payment.failed webhooks. */
  async handleWebhook(
    tenantDbName: string,
    event: string,
    payload: {
      payload: {
        payment: { entity: { order_id?: string; id?: string } };
        order?: { entity: { receipt?: string } };
      };
    },
  ): Promise<void> {
    const receipt =
      payload.payload.order?.entity?.receipt ?? payload.payload.payment.entity.order_id ?? '';

    if (event === 'payment.captured') {
      const { rows } = await this.pool(tenantDbName).query(
        `SELECT "OrderId", "PaymentStatus" FROM "Orders" WHERE "OrderNumber" = $1`,
        [receipt],
      );
      if (rows.length === 0) return;
      await this.pool(tenantDbName).query(
        `UPDATE "Orders" SET "PaymentStatus" = 'paid', "UpdatedOn" = NOW() WHERE "OrderId" = $1`,
        [rows[0].OrderId],
      );
    } else if (event === 'payment.failed') {
      const { rows } = await this.pool(tenantDbName).query(
        `SELECT "OrderId" FROM "Orders" WHERE "OrderNumber" = $1`,
        [receipt],
      );
      if (rows.length === 0) return;
      await this.pool(tenantDbName).query(
        `UPDATE "Orders" SET "PaymentStatus" = 'failed', "UpdatedOn" = NOW() WHERE "OrderId" = $1`,
        [rows[0].OrderId],
      );
    }
  }
}
