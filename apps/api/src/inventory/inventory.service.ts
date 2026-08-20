import { BadRequestException, Injectable } from '@nestjs/common';
import { TenantDbService } from '../tenancy/tenant-db.service';

export interface StockMovementRow {
  MovementId: string;
  ProductId: string;
  Type: string;
  Quantity: string;
  UnitCost?: string;
  RefId?: string;
  RefType?: string;
  CreatedOn: Date;
}

@Injectable()
export class InventoryService {
  constructor(private tenantDb: TenantDbService) {}

  private pool(tenantDbName: string) {
    return this.tenantDb.getDb(tenantDbName);
  }

  /** Current on-hand quantity for a product (0 if no stock record). */
  async getStock(tenantDbName: string, productId: string): Promise<number> {
    const { rows } = await this.pool(tenantDbName).query(
      `SELECT "Quantity" FROM "StockItems" WHERE "ProductId" = $1`,
      [productId],
    );
    return rows.length ? Number(rows[0].Quantity) : 0;
  }

  /** Record a purchase receipt: upsert StockItem + purchase_receipt movement. */
  async receiveStock(
    tenantDbName: string,
    productId: string,
    quantity: number,
    unitCost?: number,
  ): Promise<void> {
    const pool = this.pool(tenantDbName);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO "StockItems" ("ProductId", "Quantity", "AvgCost")
         VALUES ($1, $2, $3)
         ON CONFLICT ("ProductId", "LocationId")
         DO UPDATE SET "Quantity" = "StockItems"."Quantity" + $2, "AvgCost" = $3, "UpdatedOn" = NOW()`,
        [productId, quantity, unitCost ?? null],
      );
      await client.query(
        `INSERT INTO "StockMovements" ("ProductId", "Type", "Quantity", "UnitCost")
         VALUES ($1, 'purchase_receipt', $2, $3)`,
        [productId, quantity, unitCost ?? null],
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /** Issue stock with a row lock; throws on insufficient stock. */
  async issueStock(tenantDbName: string, productId: string, quantity: number): Promise<void> {
    const pool = this.pool(tenantDbName);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(
        `SELECT "Quantity" FROM "StockItems" WHERE "ProductId" = $1 FOR UPDATE`,
        [productId],
      );
      if (rows.length === 0) {
        throw new BadRequestException('No stock record for product');
      }
      const available = Number(rows[0].Quantity);
      if (available < quantity) {
        throw new BadRequestException(`Insufficient stock: have ${available}, need ${quantity}`);
      }
      await client.query(
        `UPDATE "StockItems" SET "Quantity" = "Quantity" - $2, "UpdatedOn" = NOW()
         WHERE "ProductId" = $1`,
        [productId, quantity],
      );
      await client.query(
        `INSERT INTO "StockMovements" ("ProductId", "Type", "Quantity")
         VALUES ($1, 'sales_issue', $2)`,
        [productId, quantity],
      );
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /** Movement history for a product. */
  async listMovements(tenantDbName: string, productId: string): Promise<StockMovementRow[]> {
    const { rows } = await this.pool(tenantDbName).query(
      `SELECT "MovementId", "ProductId", "Type", "Quantity", "UnitCost", "RefId", "RefType", "CreatedOn"
       FROM "StockMovements" WHERE "ProductId" = $1 ORDER BY "CreatedOn" DESC`,
      [productId],
    );
    return rows;
  }
}
