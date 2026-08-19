import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TenantDbService } from '../tenancy/tenant-db.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, OtpService, TenantDbService],
  exports: [AuthService],
})
export class AuthModule {}
