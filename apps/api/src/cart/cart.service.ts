import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRedis } from './redis.decorator';
import { Redis } from 'ioredis';
import { TenantDbService } from '../tenancy/tenant-db.service';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
}

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

@Injectable()
export class CartService {
  constructor(
    @InjectRedis() private redis: Redis,
    private tenantDb: TenantDbService,
  ) {}

  private key(cartId: string) {
    return `cart:${cartId}`;
  }

  private pool(tenantDbName: string) {
    return this.tenantDb.getDb(tenantDbName);
  }

  private compute(items: CartItem[]): Cart {
    return {
      items,
      totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    };
  }

  async getCart(cartId: string): Promise<Cart> {
    const raw = await this.redis.get(this.key(cartId));
    if (!raw) return { items: [], totalItems: 0, subtotal: 0 };
    const items: CartItem[] = JSON.parse(raw);
    return this.compute(items);
  }

  async addItem(tenantDbName: string, cartId: string, productId: string, quantity = 1): Promise<Cart> {
    const cart = await this.getCart(cartId);
    const existing = cart.items.find((i) => i.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      const { rows } = await this.pool(tenantDbName).query(
        `SELECT "ProductId", "Name", "SellingPrice" FROM "Products" WHERE "ProductId" = $1`,
        [productId],
      );
      if (rows.length === 0) throw new NotFoundException('Product not found');
      cart.items.push({
        productId,
        quantity,
        price: Number(rows[0].SellingPrice),
        name: rows[0].Name,
      });
    }

    // Stock check
    const stock = await this.checkStock(tenantDbName, productId);
    if (stock < cart.items.find((i) => i.productId === productId)!.quantity) {
      throw new BadRequestException(`Only ${stock} available`);
    }

    return this.save(cartId, cart.items);
  }

  async updateQuantity(cartId: string, productId: string, quantity: number): Promise<Cart> {
    const cart = await this.getCart(cartId);
    const item = cart.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundException('Item not in cart');

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.productId !== productId);
    } else {
      item.quantity = quantity;
    }
    return this.save(cartId, cart.items);
  }

  async removeItem(cartId: string, productId: string): Promise<Cart> {
    const cart = await this.getCart(cartId);
    cart.items = cart.items.filter((i) => i.productId !== productId);
    return this.save(cartId, cart.items);
  }

  async clearCart(cartId: string): Promise<void> {
    await this.redis.del(this.key(cartId));
  }

  private async checkStock(tenantDbName: string, productId: string): Promise<number> {
    const { rows } = await this.pool(tenantDbName).query(
      `SELECT "Quantity" FROM "StockItems" WHERE "ProductId" = $1`,
      [productId],
    );
    return rows.length ? Number(rows[0].Quantity) : 0;
  }

  private async save(cartId: string, items: CartItem[]): Promise<Cart> {
    await this.redis.set(this.key(cartId), JSON.stringify(items), 'EX', TTL_SECONDS);
    return this.compute(items);
  }
}
