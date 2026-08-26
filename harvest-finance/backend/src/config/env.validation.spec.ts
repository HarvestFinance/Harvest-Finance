import { envValidationSchema } from './env.validation';

/**
 * Base environment that satisfies every required variable. Individual tests
 * clone it and remove/override entries. All values are synthetic fixtures —
 * never real credentials.
 */
const validEnv = {
  NODE_ENV: 'development',
  PORT: '5000',
  DB_HOST: 'localhost',
  DB_USER: 'postgres',
  DB_PASSWORD: 'synthetic-db-password',
  DB_NAME: 'harvest_finance',
  JWT_SECRET: 'synthetic-jwt-secret-value',
  JWT_REFRESH_SECRET: 'synthetic-jwt-refresh-secret-value',
  STELLAR_NETWORK: 'testnet',
  STELLAR_NETWORK_PASSPHRASE: 'Test SDF Network ; September 2015',
  STELLAR_SERVER_SECRET: 'S synthetic-stellar-server-secret',
  STELLAR_PLATFORM_PUBLIC_KEY:
    'GD3BFFX7DTNJAGDVVM5RYGGQQNURZTH4VSBLWF55YXY3L6T2WWZK57EI',
  WEBHOOK_PAYMENTS_HMAC_SECRET: 'synthetic-webhook-payments-secret',
  WEBHOOK_CHAIN_EVENTS_HMAC_SECRET: 'synthetic-webhook-chain-events-secret',
};

function validate(env: Record<string, string>) {
  return envValidationSchema.validate(env, {
    allowUnknown: true,
    abortEarly: false,
  });
}

describe('envValidationSchema', () => {
  it('accepts an environment containing every required variable', () => {
    const { error, value } = validate(validEnv);

    expect(error).toBeUndefined();
    expect(value.PORT).toBe(5000);
    expect(value.JWT_EXPIRES_IN).toBe('1h');
  });

  it.each([
    'DB_HOST',
    'DB_USER',
    'DB_PASSWORD',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'STELLAR_NETWORK',
    'STELLAR_NETWORK_PASSPHRASE',
    'STELLAR_SERVER_SECRET',
    'STELLAR_PLATFORM_PUBLIC_KEY',
    'WEBHOOK_PAYMENTS_HMAC_SECRET',
    'WEBHOOK_CHAIN_EVENTS_HMAC_SECRET',
  ])('fails when required variable %s is missing', (missing) => {
    const env = { ...validEnv };
    delete env[missing];

    const { error } = validate(env);

    expect(error).toBeDefined();
    expect(JSON.stringify(error?.details)).toContain(`"${missing}"`);
  });

  it('reports every missing variable when abortEarly is disabled', () => {
    const env = { ...validEnv };
    delete env.DB_PASSWORD;
    delete env.JWT_SECRET;

    const { error } = validate(env);

    const messages = error?.details.map((d) => d.message).join(' | ') ?? '';
    expect(messages).toContain('DB_PASSWORD');
    expect(messages).toContain('JWT_SECRET');
  });

  it('never includes secret values in validation error messages', () => {
    const env = { ...validEnv };
    delete env.DB_PASSWORD;

    const { error } = validate(env);

    expect(error).toBeDefined();
    const serialized = JSON.stringify(error);
    expect(serialized).not.toContain(validEnv.DB_PASSWORD);
  });

  it('rejects invalid values for constrained variables', () => {
    const { error } = validate({
      ...validEnv,
      STELLAR_NETWORK: 'mainnet-unsupported-value',
      LOG_LEVEL: 'loud',
    });

    expect(error).toBeDefined();
    const messages = error?.details.map((d) => d.message).join(' | ') ?? '';
    expect(messages).toContain('STELLAR_NETWORK');
    expect(messages).toContain('LOG_LEVEL');
  });

  it('requires AWS_REGION only when SECRETS_PROVIDER is aws', () => {
    const awsWithoutRegion = validate({
      ...validEnv,
      SECRETS_PROVIDER: 'aws',
    });
    expect(awsWithoutRegion.error).toBeDefined();

    const awsWithRegion = validate({
      ...validEnv,
      SECRETS_PROVIDER: 'aws',
      AWS_REGION: 'us-east-1',
    });
    expect(awsWithRegion.error).toBeUndefined();

    const envProvider = validate({
      ...validEnv,
      SECRETS_PROVIDER: 'env',
    });
    expect(envProvider.error).toBeUndefined();
  });
});
