import { Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.decorator';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TenantDbService } from '../tenancy/tenant-db.service';

@Module({
  controllers: [CartController],
  providers: [
    CartService,
    TenantDbService,
    {
      provide: REDIS_CLIENT,
      useFactory: () =>
        new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT || 6379),
          lazyConnect: false,
        }),
    },
  ],
  exports: [CartService],
})
export class CartModule {}
