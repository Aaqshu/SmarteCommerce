import { Body, Controller, Param, Post } from '@nestjs/common';
import { LogisticsService, ShipmentAddress } from './logistics.service';

@Controller('tenants/:tenantDbName/logistics')
export class LogisticsController {
  constructor(private logistics: LogisticsService) {}

  @Post('orders/:orderId/shipments')
  createShipment(
    @Param('tenantDbName') tenantDbName: string,
    @Param('orderId') orderId: string,
    @Body() address: ShipmentAddress,
  ) {
    return this.logistics.createShipment(tenantDbName, orderId, address);
  }

  @Post('shipments/:shipmentId/awb')
  generateAwb(@Param('tenantDbName') tenantDbName: string, @Param('shipmentId') shipmentId: string) {
    return this.logistics.generateAwb(tenantDbName, shipmentId);
  }

  @Post('webhook/tracking')
  trackingWebhook(
    @Param('tenantDbName') tenantDbName: string,
    @Body() body: { orderNumber?: string; status?: string; description?: string },
  ) {
    return this.logistics.handleTrackingUpdate(
      tenantDbName,
      body.orderNumber ?? '',
      body.status ?? '',
      body.description ?? '',
    );
  }
}
