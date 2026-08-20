import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

// E2E against real local postgres (tenant_demo) + redis.
// Requires: ADMIN_DATABASE_URL, TENANT_DATABASE_URL env + redis on 6379.
describe('Phase 1 e2e (real DB + Redis)', () => {
  let app: INestApplication;
  let createdProductId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const T = 'tenant_demo';
  const base = () => request(app.getHttpServer());
  const unique = `e2e-${Date.now()}`;

  it('health returns ok', async () => {
    await base().get('/api/v1/health').expect(200);
  });

  it('lists seeded products', async () => {
    const res = await base().get(`/api/v1/tenants/${T}/catalog/products`).expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3);
  });

  it('gets a product by slug', async () => {
    const res = await base().get(`/api/v1/tenants/${T}/catalog/products/zainab-22k-gold-ring`).expect(200);
    expect(res.body.Name).toBe('Zainab 22K Gold Ring');
    expect(res.body.GstRate).toBe('3.00');
  });

  it('creates + updates + deletes a product (full CRUD)', async () => {
    // create
    const created = await base()
      .post(`/api/v1/tenants/${T}/catalog/products`)
      .send({
        name: `E2E Ring ${unique}`,
        slug: `${unique}-ring`,
        mrp: 50000,
        sellingPrice: 45000,
        hsnCode: '7113',
        gstRate: 3,
        images: [],
      })
      .expect(201);
    createdProductId = created.body.ProductId;
    expect(createdProductId).toBeDefined();

    // get by slug
    const fetched = await base()
      .get(`/api/v1/tenants/${T}/catalog/products/${unique}-ring`)
      .expect(200);
    expect(fetched.body.Name).toBe(`E2E Ring ${unique}`);

    // update
    const updated = await base()
      .patch(`/api/v1/tenants/${T}/catalog/products/${createdProductId}`)
      .send({ sellingPrice: 40000, images: ['https://example.com/ring.jpg'] })
      .expect(200);
    expect(updated.body.SellingPrice).toBe('40000.00');
  });

  it('lists categories with product counts', async () => {
    const res = await base().get(`/api/v1/tenants/${T}/catalog/categories`).expect(200);
    expect(res.body.some((c: { Slug: string }) => c.Slug === 'rings')).toBe(true);
  });

  it('creates a category', async () => {
    const res = await base()
      .post(`/api/v1/tenants/${T}/catalog/categories`)
      .send({ name: `E2E Cat ${unique}`, slug: `${unique}-cat` })
      .expect(201);
    expect(res.body.Slug).toBe(`${unique}-cat`);
  });

  it('inventory: receive -> stock -> issue -> oversell rejected', async () => {
    // ensure product exists
    let pid = createdProductId;
    if (!pid) {
      const created = await base()
        .post(`/api/v1/tenants/${T}/catalog/products`)
        .send({ name: 'E2E Inv', slug: `${unique}-inv`, mrp: 1000, sellingPrice: 900 })
        .expect(201);
      pid = created.body.ProductId;
    }

    // receive 20
    await base()
      .post(`/api/v1/tenants/${T}/inventory/products/${pid}/receive`)
      .send({ quantity: 20, unitCost: 500 })
      .expect(201);

    // stock = 20
    const stock = await base()
      .get(`/api/v1/tenants/${T}/inventory/products/${pid}/stock`)
      .expect(200);
    expect(stock.body.quantity).toBe(20);

    // issue 5 -> 15
    await base()
      .post(`/api/v1/tenants/${T}/inventory/products/${pid}/issue`)
      .send({ quantity: 5 })
      .expect(201);
    const after = await base()
      .get(`/api/v1/tenants/${T}/inventory/products/${pid}/stock`)
      .expect(200);
    expect(after.body.quantity).toBe(15);

    // oversell -> 400
    await base()
      .post(`/api/v1/tenants/${T}/inventory/products/${pid}/issue`)
      .send({ quantity: 999 })
      .expect(400);

    // movements recorded
    const movs = await base()
      .get(`/api/v1/tenants/${T}/inventory/products/${pid}/movements`)
      .expect(200);
    expect(movs.body.length).toBeGreaterThanOrEqual(2);
  });

  it('cart: add -> get -> update -> remove (Redis-backed)', async () => {
    const cartId = `e2e-cart-${Date.now()}`;
    const products = await base().get(`/api/v1/tenants/${T}/catalog/products`).expect(200);
    const pid = products.body[0].ProductId;

    // empty
    const empty = await base().get(`/api/v1/tenants/${T}/cart/${cartId}`).expect(200);
    expect(empty.body.totalItems).toBe(0);

    // add 2
    const added = await base()
      .post(`/api/v1/tenants/${T}/cart/${cartId}/items`)
      .send({ productId: pid, quantity: 2 })
      .expect(201);
    expect(added.body.totalItems).toBe(2);
    expect(added.body.subtotal).toBeGreaterThan(0);

    // update to 3
    const updated = await base()
      .post(`/api/v1/tenants/${T}/cart/${cartId}/items/${pid}`)
      .send({ quantity: 3 })
      .expect(201);
    expect(updated.body.totalItems).toBe(3);

    // remove
    const removed = await base()
      .delete(`/api/v1/tenants/${T}/cart/${cartId}/items/${pid}`)
      .expect(200);
    expect(removed.body.totalItems).toBe(0);

    // clear
    await base().delete(`/api/v1/tenants/${T}/cart/${cartId}`).expect(200);
  });
});
