import { Module } from '@nestjs/common';
import { LogisticsController } from './logistics.controller';
import { LogisticsService } from './logistics.service';
import { TenantDbService } from '../tenancy/tenant-db.service';
import axios from 'axios';

@Module({
  controllers: [LogisticsController],
  providers: [
    LogisticsService,
    TenantDbService,
    {
      provide: 'SHIPROCKET_HTTP',
      useFactory: () => axios.create({ timeout: 15000 }),
    },
    {
      provide: 'SHIPROCKET_EMAIL',
      useFactory: () => process.env.SHIPROCKET_EMAIL || '',
    },
    {
      provide: 'SHIPROCKET_PASSWORD',
      useFactory: () => process.env.SHIPROCKET_PASSWORD || '',
    },
  ],
  exports: [LogisticsService],
})
export class LogisticsModule {}
