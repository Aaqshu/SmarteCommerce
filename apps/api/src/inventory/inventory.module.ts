import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { TenantDbService } from '../tenancy/tenant-db.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, TenantDbService],
  exports: [InventoryService],
})
export class InventoryModule {}
