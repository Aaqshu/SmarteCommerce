import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { TenantDbService } from '../tenancy/tenant-db.service';
import Razorpay = require('razorpay');

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    TenantDbService,
    {
      provide: 'RAZORPAY_CLIENT',
      useFactory: () => {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        // In dev without keys, provide a stub that clearly fails at call time.
        if (!keyId || !keySecret) {
          return {
            orders: {
              create: () => {
                throw new Error('RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET not configured');
              },
            },
          };
        }
        return new Razorpay({ key_id: keyId, key_secret: keySecret });
      },
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
