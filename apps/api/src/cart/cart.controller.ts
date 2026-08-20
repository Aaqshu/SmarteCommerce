import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('tenants/:tenantDbName/cart')
export class CartController {
  constructor(private cart: CartService) {}

  @Get(':cartId')
  get(@Param('tenantDbName') tenantDbName: string, @Param('cartId') cartId: string) {
    return this.cart.getCart(cartId);
  }

  @Post(':cartId/items')
  add(
    @Param('tenantDbName') tenantDbName: string,
    @Param('cartId') cartId: string,
    @Body() body: { productId: string; quantity?: number },
  ) {
    return this.cart.addItem(tenantDbName, cartId, body.productId, body.quantity);
  }

  @Post(':cartId/items/:productId')
  update(
    @Param('tenantDbName') tenantDbName: string,
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
  ) {
    return this.cart.updateQuantity(cartId, productId, body.quantity);
  }

  @Delete(':cartId/items/:productId')
  remove(
    @Param('tenantDbName') tenantDbName: string,
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
  ) {
    return this.cart.removeItem(cartId, productId);
  }

  @Delete(':cartId')
  clear(@Param('tenantDbName') tenantDbName: string, @Param('cartId') cartId: string) {
    return this.cart.clearCart(cartId);
  }
}
