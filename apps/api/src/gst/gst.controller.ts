import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TaxEngineService } from './tax-engine.service';
import { GstinValidator } from './gstin.validator';
import { HsnService } from './hsn.service';

@Controller('gst')
export class GstController {
  constructor(
    private taxEngine: TaxEngineService,
    private gstinValidator: GstinValidator,
    private hsn: HsnService,
  ) {}

  @Get('hsn')
  listHsn(@Query('tenantDbName') tenantDbName: string) {
    return this.hsn.list(tenantDbName);
  }

  @Post('hsn/seed')
  seedHsn(@Query('tenantDbName') tenantDbName: string) {
    return this.hsn.seedStandardRates(tenantDbName);
  }

  @Get('hsn/:hsnCode')
  getHsn(@Query('tenantDbName') tenantDbName: string, @Param('hsnCode') hsnCode: string) {
    return this.hsn.resolveRate(tenantDbName, hsnCode);
  }

  @Post('calculate')
  calculate(
    @Query('sellerState') sellerState: string,
    @Query('buyerState') buyerState: string,
    @Query('amount') amount: string,
    @Query('rate') rate: string,
  ) {
    return this.taxEngine.calculate({
      taxableAmount: parseFloat(amount),
      gstRate: parseFloat(rate),
      sellerState,
      buyerState,
    });
  }

  @Get('gstin/:gstin/validate')
  validate(@Param('gstin') gstin: string) {
    return { gstin, valid: this.gstinValidator.isValid(gstin) };
  }
}
