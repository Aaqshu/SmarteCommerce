import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('health returns ok', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200);
  });

  it('otp request rejects missing contact', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ tenantDbName: 'tenant_demo' })
      .expect(400);
  });

  it('otp request returns requestId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ tenantDbName: 'tenant_demo', phone: '+919999999999' })
      .expect(201);
    expect(res.body.requestId).toBeDefined();
  });

  it('otp verify rejects wrong otp', async () => {
    const req = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/request')
      .send({ tenantDbName: 'tenant_demo', phone: '+918888888888' });
    await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ tenantDbName: 'tenant_demo', requestId: req.body.requestId, otp: '000000', phone: '+918888888888' })
      .expect(401);
  });
});
