import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CatalogService, ListProductsQuery } from './catalog.service';

@Controller('tenants/:tenantDbName/catalog')
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  @Get('products')
  list(@Param('tenantDbName') tenantDbName: string, @Query() query: ListProductsQuery) {
    return this.catalog.listProducts(tenantDbName, query);
  }

  @Get('products/:slug')
  get(@Param('tenantDbName') tenantDbName: string, @Param('slug') slug: string) {
    return this.catalog.getProduct(tenantDbName, slug);
  }

  @Post('products')
  create(@Param('tenantDbName') tenantDbName: string, @Body() body: Parameters<CatalogService['createProduct']>[1]) {
    return this.catalog.createProduct(tenantDbName, body);
  }

  @Patch('products/:productId')
  update(
    @Param('tenantDbName') tenantDbName: string,
    @Param('productId') productId: string,
    @Body() body: Parameters<CatalogService['updateProduct']>[2],
  ) {
    return this.catalog.updateProduct(tenantDbName, productId, body);
  }
}
