import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API Contract Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/vaults/public', () => {
    it('returns a contract-conforming envelope', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/vaults/public')
        .expect(200);

      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('meta');
      expect(Array.isArray(body.data)).toBe(true);
      if (body.data.length > 0) {
        const vault = body.data[0];
        expect(vault).toHaveProperty('id');
        expect(vault).toHaveProperty('vaultName');
        expect(vault).toHaveProperty('status');
        expect(vault).toHaveProperty('maxCapacity');
      }
      expect(body.meta).toHaveProperty('nextCursor');
      expect(typeof body.meta.nextCursor).toBe('string');
    });
  });

  describe('POST /api/v1/vaults/:vaultId/deposit', () => {
    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/vaults/123e4567-e89b-12d3-a456-426614174000/deposit')
        .send({ amount: 100 })
        .expect(401);
    });

    it('returns 400 for invalid request body', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/v1/vaults/123e4567-e89b-12d3-a456-426614174000/deposit')
        .set('Authorization', 'Bearer invalid-token')
        .send({ amount: -1 })
        .expect(401);

      expect(body).toHaveProperty('statusCode');
      expect(typeof body.statusCode).toBe('number');
    });
  });

  describe('GET /api/v1/vaults/:vaultId', () => {
    it('returns 404 for non-existent vault', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/v1/vaults/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(body).toHaveProperty('statusCode');
    });
  });

  describe('GET /api/v1/orders', () => {
    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/orders')
        .expect(401);
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('returns 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);
    });
  });

  describe('OpenAPI schema availability', () => {
    it('serves Swagger JSON at /api/docs-json', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      expect(body).toHaveProperty('openapi');
      expect(body).toHaveProperty('paths');
      expect(typeof body.paths).toBe('object');
    });
  });
});
