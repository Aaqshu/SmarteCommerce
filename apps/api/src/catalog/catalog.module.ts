import { Module } from '@nestjs/common';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CategoriesService } from './categories.service';
import { TenantDbService } from '../tenancy/tenant-db.service';

@Module({
  controllers: [CatalogController],
  providers: [CatalogService, CategoriesService, TenantDbService],
  exports: [CatalogService, CategoriesService],
})
export class CatalogModule {}
