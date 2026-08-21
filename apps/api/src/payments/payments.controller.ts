import { Controller, Get, Headers, Param, Post, RawBodyRequest, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('tenants/:tenantDbName/payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('orders/:orderId')
  createPaymentOrder(@Param('tenantDbName') tenantDbName: string, @Param('orderId') orderId: string) {
    return this.payments.createPaymentOrder(tenantDbName, orderId);
  }

  @Post('webhook/razorpay')
  async webhook(
    @Param('tenantDbName') tenantDbName: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
    @Res() res: Response,
  ) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    const body = (req.rawBody ?? Buffer.from(JSON.stringify(req.body))).toString();
    const event = (req.body as { event?: string })?.event ?? '';

    if (!secret || !signature || !this.payments.verifyWebhookSignature(body, signature, secret)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    await this.payments.handleWebhook(tenantDbName, event, req.body as never);
    return res.json({ received: true });
  }
}
