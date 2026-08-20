import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';

@Controller('tenants/:tenantDbName/inventory')
export class InventoryController {
  constructor(private inventory: InventoryService) {}

  @Get('products/:productId/stock')
  getStock(@Param('tenantDbName') tenantDbName: string, @Param('productId') productId: string) {
    return this.inventory.getStock(tenantDbName, productId).then((quantity) => ({ quantity }));
  }

  @Get('products/:productId/movements')
  movements(@Param('tenantDbName') tenantDbName: string, @Param('productId') productId: string) {
    return this.inventory.listMovements(tenantDbName, productId);
  }

  @Post('products/:productId/receive')
  receive(
    @Param('tenantDbName') tenantDbName: string,
    @Param('productId') productId: string,
    @Body() body: { quantity: number; unitCost?: number },
  ) {
    return this.inventory.receiveStock(tenantDbName, productId, body.quantity, body.unitCost);
  }

  @Post('products/:productId/issue')
  issue(
    @Param('tenantDbName') tenantDbName: string,
    @Param('productId') productId: string,
    @Body() body: { quantity: number },
  ) {
    return this.inventory.issueStock(tenantDbName, productId, body.quantity);
  }
}
