import { Module } from '@nestjs/common';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';
import { TaxEngineService } from '../gst/tax-engine.service';
import { TenantDbService } from '../tenancy/tenant-db.service';

@Module({
  controllers: [InvoiceController],
  providers: [InvoiceService, TaxEngineService, TenantDbService],
  exports: [InvoiceService],
})
export class InvoiceModule {}
