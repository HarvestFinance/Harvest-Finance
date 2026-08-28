import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Request Tracing — X-Request-Id propagation', () => {
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

  it('echoes an incoming X-Request-Id in the error response', async () => {
    const correlationId = 'trace-test-123';
    const { body, headers } = await request(app.getHttpServer())
      .get('/api/v1/vaults/not-found-id')
      .set('X-Request-Id', correlationId)
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(headers['x-request-id']).toBe(correlationId);
    expect(body).toHaveProperty('requestId', correlationId);
  });

  it('generates a new X-Request-Id when none is supplied', async () => {
    const { body, headers } = await request(app.getHttpServer())
      .get('/api/v1/vaults/not-found-id')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(headers['x-request-id']).toBeDefined();
    expect(typeof headers['x-request-id']).toBe('string');
    expect(headers['x-request-id'].length).toBeGreaterThan(0);
    expect(body).toHaveProperty('requestId', headers['x-request-id']);
  });

  it('propagates X-Request-Id through successful responses', async () => {
    const correlationId = 'trace-success-456';
    const { headers } = await request(app.getHttpServer())
      .get('/api/v1/vaults/public')
      .set('X-Request-Id', correlationId)
      .expect(200);

    expect(headers['x-request-id']).toBe(correlationId);
  });
});
