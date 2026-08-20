import { Injectable } from '@nestjs/common';
import { TenantDbService } from '../tenancy/tenant-db.service';

export interface CategoryRow {
  CategoryId: string;
  Name: string;
  Slug: string;
  ParentId?: string;
  ProductCount?: string;
}

export interface BrandRow {
  BrandId: string;
  Name: string;
}

@Injectable()
export class CategoriesService {
  constructor(private tenantDb: TenantDbService) {}

  private pool(tenantDbName: string) {
    return this.tenantDb.getDb(tenantDbName);
  }

  async listCategories(tenantDbName: string): Promise<CategoryRow[]> {
    const { rows } = await this.pool(tenantDbName).query(
      `SELECT c."CategoryId", c."Name", c."Slug", c."ParentId",
              COUNT(p."ProductId")::text AS "ProductCount"
       FROM "Categories" c
       LEFT JOIN "Products" p ON p."CategoryId" = c."CategoryId"
       GROUP BY c."CategoryId"
       ORDER BY c."SortOrder" ASC, c."Name" ASC`,
    );
    return rows;
  }

  async createCategory(
    tenantDbName: string,
    input: { name: string; slug: string; parentId?: string; sortOrder?: number },
  ): Promise<CategoryRow> {
    const { name, slug, parentId = null, sortOrder = 0 } = input;
    const { rows } = await this.pool(tenantDbName).query(
      `INSERT INTO "Categories" ("Name", "Slug", "ParentId", "SortOrder")
       VALUES ($1, $2, $3, $4)
       RETURNING "CategoryId", "Name", "Slug", "ParentId"`,
      [name, slug, parentId, sortOrder],
    );
    return rows[0];
  }

  async listBrands(tenantDbName: string): Promise<BrandRow[]> {
    const { rows } = await this.pool(tenantDbName).query(
      `SELECT "BrandId", "Name" FROM "Brands" ORDER BY "Name" ASC`,
    );
    return rows;
  }

  async createBrand(tenantDbName: string, input: { name: string }): Promise<BrandRow> {
    const { rows } = await this.pool(tenantDbName).query(
      `INSERT INTO "Brands" ("Name")
       VALUES ($1)
       RETURNING "BrandId", "Name"`,
      [input.name],
    );
    return rows[0];
  }
}
