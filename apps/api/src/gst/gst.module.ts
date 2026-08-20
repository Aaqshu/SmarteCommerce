import { Module } from '@nestjs/common';
import { GstController } from './gst.controller';
import { TaxEngineService } from './tax-engine.service';
import { GstinValidator } from './gstin.validator';

@Module({
  controllers: [GstController],
  providers: [TaxEngineService, GstinValidator],
  exports: [TaxEngineService, GstinValidator],
})
export class GstModule {}
