import { Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';

/**
 * Resolves and caches a pg Pool per tenant database.
 * Tenant schema: tenant_<slug> created in the same postgres instance
 * (registry in ADMIN_DATABASE_URL; tenant DBs in TENANT_DATABASE_URL).
 */
@Injectable()
export class TenantDbService {
  private pools = new Map<string, Pool>();
  private baseUrl = process.env.TENANT_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432';

  getDb(dbName: string): Pool {
    let pool = this.pools.get(dbName);
    if (!pool) {
      pool = new Pool({ connectionString: `${this.baseUrl}/${dbName}`, connectionTimeoutMillis: 8000 });
      this.pools.set(dbName, pool);
    }
    return pool;
  }

  async ensureSchema(dbName: string): Promise<void> {
    const pool = this.getDb(dbName);
    const { rows } = await pool.query(
      `SELECT to_regclass($1) AS t`,
      [`${dbName}.products`],
    );
    if (!rows[0].t) throw new NotFoundException(`Tenant schema not provisioned: ${dbName}`);
  }
}
