import { Module } from '@nestjs/common';
import { GstController } from './gst.controller';
import { TaxEngineService } from './tax-engine.service';
import { GstinValidator } from './gstin.validator';
import { HsnService } from './hsn.service';
import { TenantDbService } from '../tenancy/tenant-db.service';

@Module({
  controllers: [GstController],
  providers: [TaxEngineService, GstinValidator, HsnService, TenantDbService],
  exports: [TaxEngineService, GstinValidator, HsnService],
})
export class GstModule {}
