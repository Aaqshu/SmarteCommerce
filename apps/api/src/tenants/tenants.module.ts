import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../prisma/prisma.service';
import { TenantDbService } from '../tenancy/tenant-db.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService, PrismaService, TenantDbService],
  exports: [TenantsService],
})
export class TenantsModule {}
