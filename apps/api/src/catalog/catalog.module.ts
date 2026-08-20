import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { TenantDbService } from '../tenancy/tenant-db.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, TenantDbService],
  exports: [CatalogService],
})
export class CatalogModule {}
