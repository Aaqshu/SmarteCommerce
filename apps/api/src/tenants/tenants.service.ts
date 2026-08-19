import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantDbService } from '../tenancy/tenant-db.service';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private tenantDb: TenantDbService,
  ) {}

  list() {
    return this.prisma.tenants.findMany({ orderBy: { CreatedOn: 'desc' } });
  }

  async provision(input: {
    businessName: string;
    slug: string;
    email: string;
    plan?: 'starter' | 'pro' | 'enterprise';
  }) {
    const dbName = `tenant_${input.slug}`;
    const tenant = await this.prisma.tenants.create({
      data: {
        TenantCode: input.slug,
        BusinessName: input.businessName,
        Slug: input.slug,
        Email: input.email,
        DatabaseName: dbName,
        Plan: (input.plan as any) || 'starter',
        Status: 'active',
        TenantConfig: {
          create: {
            StoreName: input.businessName,
            Tagline: 'Coming soon',
            PrimaryColor: '#B8860B',
            AccentColor: '#8B0000',
          },
        },
      },
    });

    // Apply tenant schema to the tenant DB (002_tenant_schema.sql)
    const pool = this.tenantDb.getDb(dbName);
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${dbName}"`);
    await pool.query(`SET search_path TO "${dbName}", public`);
    return tenant;
  }
}
