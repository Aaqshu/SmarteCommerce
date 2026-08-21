import { Injectable } from '@nestjs/common';
import { TenantDbService } from '../tenancy/tenant-db.service';

export interface ProductRow {
  ProductId: string;
  Name: string;
  Slug: string;
  Description?: string;
  CategoryId?: string;
  BrandId?: string;
  HsnCode: string;
  GstRate: string;
  Mrp: string;
  SellingPrice: string;
  Images?: unknown;
  Status: string;
}

export interface ListProductsQuery {
  category?: string;
  brand?: string;
  status?: string;
  search?: string;
}

const PRODUCT_SELECT = `
  SELECT p."ProductId", p."Name", p."Slug", p."Description", p."HsnCode", p."GstRate",
         p."Mrp", p."SellingPrice", p."Images", p."Status", p."CreatedOn", p."CategoryId",
         c."Name" AS "CategoryName", b."Name" AS "BrandName"
  FROM "Products" p
  LEFT JOIN "Categories" c ON c."CategoryId" = p."CategoryId"
  LEFT JOIN "Brands" b ON b."BrandId" = p."BrandId"
`;

@Injectable()
export class CatalogService {
  constructor(private tenantDb: TenantDbService) {}

  private pool(tenantDbName: string) {
    return this.tenantDb.getDb(tenantDbName);
  }

  async listProducts(tenantDbName: string, query: ListProductsQuery = {}): Promise<ProductRow[]> {
    const where: string[] = [];
    const params: unknown[] = [];

    if (query.category) {
      params.push(query.category);
      where.push(`c."Slug" = $${params.length}`);
    }
    if (query.brand) {
      params.push(query.brand);
      where.push(`b."Slug" = $${params.length}`);
    }
    if (query.status) {
      params.push(query.status);
      where.push(`p."Status" = $${params.length}`);
    }
    if (query.search) {
      params.push(`%${query.search}%`);
      where.push(`p."Name" ILIKE $${params.length}`);
    }

    const sql = `${PRODUCT_SELECT}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY p."CreatedOn" DESC`;
    const { rows } = await this.pool(tenantDbName).query(sql, params);
    return rows;
  }

  async getProduct(tenantDbName: string, slug: string): Promise<ProductRow | null> {
    const { rows } = await this.pool(tenantDbName).query(
      `${PRODUCT_SELECT} WHERE p."Slug" = $1`,
      [slug],
    );
    return rows[0] ?? null;
  }

  async createProduct(
    tenantDbName: string,
    input: {
      name: string;
      slug: string;
      mrp: number;
      sellingPrice: number;
      hsnCode?: string;
      gstRate?: number;
      description?: string;
      categoryId?: string;
      brandId?: string;
      images?: string[];
      status?: string;
    },
  ): Promise<ProductRow> {
    const {
      name,
      slug,
      mrp,
      sellingPrice,
      hsnCode = '7113',
      gstRate = 3,
      description = null,
      categoryId = null,
      brandId = null,
      images = [],
      status = 'active',
    } = input;

    const { rows } = await this.pool(tenantDbName).query(
      `INSERT INTO "Products" ("Name", "Slug", "Description", "CategoryId", "BrandId", "HsnCode", "GstRate", "Mrp", "SellingPrice", "Images", "Status")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11)
       RETURNING "ProductId", "Name", "Slug", "HsnCode", "GstRate", "Mrp", "SellingPrice", "Status"`,
      [name, slug, description, categoryId, brandId, hsnCode, gstRate, mrp, sellingPrice, JSON.stringify(images), status],
    );
    return rows[0];
  }

  async updateProduct(
    tenantDbName: string,
    productId: string,
    patch: Partial<{
      name: string;
      description: string;
      mrp: number;
      sellingPrice: number;
      hsnCode: string;
      gstRate: number;
      categoryId: string;
      brandId: string;
      images: string[];
      status: string;
    }>,
  ): Promise<ProductRow | null> {
    const fields = Object.entries(patch).filter(([, v]) => v !== undefined);
    if (fields.length === 0) return null;

    const sets = fields.map(([key, value], i) => {
      const col = key === 'name' ? '"Name"' : key === 'description' ? '"Description"' : key === 'mrp' ? '"Mrp"' : key === 'sellingPrice' ? '"SellingPrice"' : key === 'hsnCode' ? '"HsnCode"' : key === 'gstRate' ? '"GstRate"' : key === 'categoryId' ? '"CategoryId"' : key === 'brandId' ? '"BrandId"' : key === 'images' ? '"Images"' : '"Status"';
      const rendered = key === 'images' ? `$${i + 1}::jsonb` : `$${i + 1}`;
      return `${col} = ${rendered}`;
    });

    const params = fields.map(([, v]) => (v && typeof v === 'object' ? JSON.stringify(v) : v));
    params.push(productId);

    const { rows } = await this.pool(tenantDbName).query(
      `UPDATE "Products" SET ${sets.join(', ')}, "UpdatedOn" = NOW()
       WHERE "ProductId" = $${params.length}
       RETURNING "ProductId", "Name", "Slug", "HsnCode", "GstRate", "Mrp", "SellingPrice", "Status"`,
      params,
    );
    return rows[0] ?? null;
  }
}
