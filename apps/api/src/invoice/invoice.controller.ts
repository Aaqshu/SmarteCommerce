import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InvoiceService } from './invoice.service';

@Controller('tenants/:tenantDbName/invoices')
export class InvoiceController {
  constructor(private invoices: InvoiceService) {}

  @Post('orders/:orderId')
  createTaxInvoice(@Param('tenantDbName') tenantDbName: string, @Param('orderId') orderId: string) {
    return this.invoices.createTaxInvoice(tenantDbName, orderId);
  }

  @Post('orders/:orderId/credit-note')
  createCreditNote(
    @Param('tenantDbName') tenantDbName: string,
    @Param('orderId') orderId: string,
    @Query('reason') reason: string,
  ) {
    return this.invoices.createCreditNote(tenantDbName, orderId, reason || 'Return');
  }

  @Get('gstr1')
  gstr1(@Param('tenantDbName') tenantDbName: string, @Query('fy') fy: string) {
    return this.invoices.gstr1(tenantDbName, fy || new Date().getFullYear() + '-' + String(new Date().getFullYear() + 1).slice(2));
  }

  @Get('gstr3b')
  gstr3b(
    @Param('tenantDbName') tenantDbName: string,
    @Query('fy') fy: string,
    @Query('month') month: string,
  ) {
    return this.invoices.gstr3b(tenantDbName, fy || '2025-26', month || String(new Date().getMonth() + 1).padStart(2, '0'));
  }
}
