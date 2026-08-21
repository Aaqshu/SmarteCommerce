import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { OrdersService, CreateOrderInput } from './orders.service';

@Controller('tenants/:tenantDbName/orders')
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post(':cartId')
  create(
    @Param('tenantDbName') tenantDbName: string,
    @Param('cartId') cartId: string,
    @Body() body: CreateOrderInput,
  ) {
    return this.orders.createOrder(tenantDbName, cartId, body);
  }

  @Get('user/:userId')
  list(@Param('tenantDbName') tenantDbName: string, @Param('userId') userId: string) {
    return this.orders.listOrders(tenantDbName, userId);
  }

  @Get()
  listAll(@Param('tenantDbName') tenantDbName: string, @Query('status') status?: string) {
    return this.orders.listAllOrders(tenantDbName, status);
  }

  @Patch(':orderId/status')
  updateStatus(
    @Param('tenantDbName') tenantDbName: string,
    @Param('orderId') orderId: string,
    @Body() body: { status: string },
  ) {
    return this.orders.updateOrderStatus(tenantDbName, orderId, body.status);
  }
}
