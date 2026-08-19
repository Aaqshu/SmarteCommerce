import { Controller, Get, Post, Body } from '@nestjs/common';
import { TenantsService } from './tenants.service';

@Controller('admin/tenants')
export class TenantsController {
  constructor(private tenants: TenantsService) {}

  @Get()
  list() {
    return this.tenants.list();
  }

  @Post()
  provision(@Body() body: { businessName: string; slug: string; email: string; plan?: 'starter' | 'pro' | 'enterprise' }) {
    return this.tenants.provision(body);
  }
}
