import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TaxEngineService } from '../gst/tax-engine.service';
import { CartService } from '../cart/cart.service';
import { REDIS_CLIENT } from '../cart/redis.decorator';
import { TenantDbService } from '../tenancy/tenant-db.service';
import Redis from 'ioredis';

@Module({
  controllers: [OrdersController],
  providers: [
    OrdersService,
    TaxEngineService,
    CartService,
    TenantDbService,
    {
      provide: REDIS_CLIENT,
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT || 6379),
        }),
    },
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
