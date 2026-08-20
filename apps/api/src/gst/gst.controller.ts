import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TaxEngineService } from './tax-engine.service';
import { GstinValidator } from './gstin.validator';

@Controller('gst')
export class GstController {
  constructor(
    private taxEngine: TaxEngineService,
    private gstinValidator: GstinValidator,
  ) {}

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
