import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() body: { tenantDbName: string; phone?: string; email?: string }) {
    return this.auth.requestOtp(body.tenantDbName, body.phone, body.email);
  }

  @Post('otp/verify')
  verifyOtp(@Body() body: { tenantDbName: string; requestId: string; otp: string; phone?: string; email?: string }) {
    return this.auth.verifyOtp(body.tenantDbName, body.requestId, body.otp, body.phone, body.email);
  }

  @Post('login')
  login(@Body() body: { userName: string; password: string }) {
    return this.auth.adminLogin(body.userName, body.password);
  }
}
