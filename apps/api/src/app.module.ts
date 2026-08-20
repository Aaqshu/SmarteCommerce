import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { TenantDbService } from './tenancy/tenant-db.service';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { CatalogModule } from './catalog/catalog.module';
import { InventoryModule } from './inventory/inventory.module';
import { CartModule } from './cart/cart.module';
import { GstModule } from './gst/gst.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true, secret: process.env.JWT_SECRET || 'dev-secret' }),
    AuthModule,
    TenantsModule,
    CatalogModule,
    InventoryModule,
    CartModule,
    GstModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService, TenantDbService],
  exports: [PrismaService, TenantDbService],
})
export class AppModule {}
