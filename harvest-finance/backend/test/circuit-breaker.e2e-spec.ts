import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../src/database/entities/user.entity';
import {
  Vault,
  VaultStatus,
  VaultType,
} from '../src/database/entities/vault.entity';
import { Deposit } from '../src/database/entities/deposit.entity';
import { Withdrawal } from '../src/database/entities/withdrawal.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

describe('Platform Circuit Breaker Integration (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let vaultRepository: Repository<Vault>;
  let depositRepository: Repository<Deposit>;
  let withdrawalRepository: Repository<Withdrawal>;

  let testUser: User;
  let adminUser: User;
  let userAccessToken: string;
  let adminAccessToken: string;
  let activeVault: Vault;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    userRepository = app.get(getRepositoryToken(User));
    vaultRepository = app.get(getRepositoryToken(Vault));
    depositRepository = app.get(getRepositoryToken(Deposit));
    withdrawalRepository = app.get(getRepositoryToken(Withdrawal));

    const hashedPassword = await bcrypt.hash('SecurePass123!', 10);

    testUser = userRepository.create({
      email: `cb_tester_${Date.now()}@example.com`,
      password: hashedPassword,
      role: UserRole.FARMER,
      firstName: 'Circuit',
      lastName: 'Tester',
      isActive: true,
    });
    await userRepository.save(testUser);

    adminUser = userRepository.create({
      email: `cb_admin_${Date.now()}@example.com`,
      password: hashedPassword,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'Tester',
      isActive: true,
    });
    await userRepository.save(adminUser);

    const userLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'SecurePass123!',
      });
    userAccessToken = userLogin.body.access_token;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: adminUser.email,
        password: 'SecurePass123!',
      });
    adminAccessToken = adminLogin.body.access_token;

    activeVault = vaultRepository.create({
      ownerId: testUser.id,
      type: VaultType.CROP_PRODUCTION,
      status: VaultStatus.ACTIVE,
      vaultName: 'Circuit Breaker Test Vault',
      description: 'A vault for circuit breaker testing',
      symbol: 'TEST',
      assetPair: 'XLM/USDC',
      maxCapacity: 10000,
      interestRate: 5,
      isPublic: true,
    });
    await vaultRepository.save(activeVault);
  });

  afterAll(async () => {
    await depositRepository.delete({ userId: testUser.id });
    await withdrawalRepository.delete({ userId: testUser.id });
    await vaultRepository.delete({ id: activeVault.id });
    await userRepository.delete({ id: adminUser.id });
    await userRepository.delete({ id: testUser.id });
    await app.close();
  });

  afterEach(async () => {
    const state = await request(app.getHttpServer())
      .post('/api/v1/admin/platform/circuit-breaker/close')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ reason: 'Test cleanup' });
  });

  describe('Admin endpoints', () => {
    it('should activate circuit breaker as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Critical incident' })
        .expect(200);

      expect(response.body).toEqual({ active: true });
    });

    it('should deactivate circuit breaker as admin', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send();

      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/close')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Resolved' })
        .expect(200);

      expect(response.body).toEqual({ active: false });
    });

    it('should reject non-admin access to circuit breaker endpoints', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send()
        .expect(403);
    });

    it('should reject unauthenticated access to circuit breaker endpoints', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .send()
        .expect(401);
    });
  });

  describe('Deposit blocking', () => {
    it('should allow deposit when circuit breaker is inactive', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/vaults/${activeVault.id}/deposit`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ amount: 100, idempotencyKey: `dep_allow_${Date.now()}` })
        .expect(200);

      expect(response.body).toHaveProperty('deposit');
    });

    it('should block deposit when circuit breaker is active', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Test maintenance' });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/vaults/${activeVault.id}/deposit`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ amount: 200, idempotencyKey: `dep_block_${Date.now()}` });

      expect(response.status).toBe(503);
      expect(response.body).toEqual({
        statusCode: 503,
        message: expect.any(String),
        error: 'Maintenance Mode',
      });
    });

    it('should block batch deposit when circuit breaker is active', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Test maintenance' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/vaults/deposits/batch')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          deposits: [
            {
              vaultId: activeVault.id,
              amount: 100,
              idempotencyKey: `batch_block_${Date.now()}`,
            },
          ],
        });

      expect(response.status).toBe(503);
      expect(response.body.error).toBe('Maintenance Mode');
    });
  });

  describe('Withdrawal blocking', () => {
    it('should block withdrawal when circuit breaker is active', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Test maintenance' });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/vaults/${activeVault.id}/withdraw`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ amount: 50 });

      expect(response.status).toBe(503);
      expect(response.body.error).toBe('Maintenance Mode');
    });
  });

  describe('Farm vault blocking', () => {
    it('should block farm vault deposit when circuit breaker is active', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Test maintenance' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/farm-vaults/some-id/deposit')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ amount: 100 });

      expect(response.status).toBe(503);
      expect(response.body.error).toBe('Maintenance Mode');
    });

    it('should block farm vault withdrawal when circuit breaker is active', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Test maintenance' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/farm-vaults/some-id/withdraw')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ amount: 50 });

      expect(response.status).toBe(503);
      expect(response.body.error).toBe('Maintenance Mode');
    });
  });

  describe('Insurance fund deposit blocking', () => {
    it('should block insurance fund deposit when circuit breaker is active', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Test maintenance' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/insurance-fund/deposit')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ userId: testUser.id, amount: 100 });

      expect(response.status).toBe(503);
      expect(response.body.error).toBe('Maintenance Mode');
    });
  });

  describe('Read-only endpoints', () => {
    it('should allow reading vault info when circuit breaker is active', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Test maintenance' });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/vaults/${activeVault.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('vaultName');
    });

    it('should allow reading user vaults when circuit breaker is active', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/vaults/my-vaults')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Redis propagation', () => {
    it('should propagate activation across requests', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Redis propagation test' });

      const depositResponse = await request(app.getHttpServer())
        .post(`/api/v1/vaults/${activeVault.id}/deposit`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ amount: 300, idempotencyKey: `dep_prop_${Date.now()}` });

      expect(depositResponse.status).toBe(503);
    });
  });

  describe('Edge cases', () => {
    it('should work without optional reason field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({})
        .expect(200);

      expect(response.body).toEqual({ active: true });
    });

    it('should handle rapid open/close toggles', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/open')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Toggle 1' });

      const close1 = await request(app.getHttpServer())
        .post('/api/v1/admin/platform/circuit-breaker/close')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ reason: 'Toggle 2' });

      expect(close1.body).toEqual({ active: false });

      const response = await request(app.getHttpServer())
        .post(`/api/v1/vaults/${activeVault.id}/deposit`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ amount: 500, idempotencyKey: `dep_toggle_${Date.now()}` })
        .expect(200);

      expect(response.body).toHaveProperty('deposit');
    });
  });
});
