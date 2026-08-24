import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import axios from 'axios';
import { Keypair } from '@stellar/stellar-sdk';

@Injectable()
export class SecretsService implements OnModuleInit {
  private readonly logger = new Logger(SecretsService.name);
  private awsClient: SecretsManagerClient | null = null;
  private stellarKeyRotation: {
    active: string;
    previous?: string;
    transitionEndsAt?: Date;
  } | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const provider = this.configService.get<string>('SECRETS_PROVIDER', 'env');
    if (provider === 'aws') {
      const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
      this.awsClient = new SecretsManagerClient({ region });
      this.logger.log(`Secrets provider initialized: AWS (Region: ${region})`);
    } else if (provider === 'vault') {
      this.logger.log('Secrets provider initialized: HashiCorp Vault');
    } else {
      this.logger.log('Secrets provider initialized: Environment Variables');
    }
  }

  async getSecret(key: string): Promise<string | undefined> {
    const provider = this.configService.get<string>('SECRETS_PROVIDER', 'env');

    try {
      if (provider === 'aws') {
        return await this.getAwsSecret(key);
      } else if (provider === 'vault') {
        return await this.getVaultSecret(key);
      }
    } catch (err) {
      this.logger.error(
        `Failed to fetch secret "${key}" from ${provider}: ${err.message}`,
      );
    }

    // Default fallback to environment variables
    return this.configService.get<string>(key);
  }

  async rotateStellarSigningKey(
    nextKey: string,
    transitionHours = 24,
  ): Promise<{ transitionEndsAt: string }> {
    if (!nextKey.trim()) throw new Error('A Stellar signing key is required');
    Keypair.fromSecret(nextKey);
    const current =
      this.stellarKeyRotation?.active ||
      (await this.getSecret('STELLAR_SIGNING_KEY'));
    const transitionEndsAt = new Date(
      Date.now() + Math.max(0, transitionHours) * 60 * 60 * 1000,
    );
    this.stellarKeyRotation = {
      active: nextKey,
      previous: current || undefined,
      transitionEndsAt,
    };
    return { transitionEndsAt: transitionEndsAt.toISOString() };
  }

  async signWithStellarKeys(payload: string): Promise<string[]> {
    const keys = await this.getActiveStellarKeys();
    return keys.map((secret) =>
      Keypair.fromSecret(secret).sign(Buffer.from(payload)).toString('base64'),
    );
  }

  private async getActiveStellarKeys(): Promise<string[]> {
    if (!this.stellarKeyRotation) {
      const active = await this.getSecret('STELLAR_SIGNING_KEY');
      if (!active) throw new Error('STELLAR_SIGNING_KEY is not configured');
      return [active];
    }
    const { active, previous, transitionEndsAt } = this.stellarKeyRotation;
    if (previous && transitionEndsAt && transitionEndsAt > new Date()) {
      return [active, previous];
    }
    return [active];
  }

  private async getAwsSecret(key: string): Promise<string> {
    if (!this.awsClient) {
      throw new Error('AWS Secrets Manager client not initialized');
    }

    const secretId = this.configService.get<string>(
      `AWS_SECRET_ID_${key}`,
      key,
    );
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response = await this.awsClient.send(command);

    if (response.SecretString) {
      try {
        const secrets = JSON.parse(response.SecretString);
        if (typeof secrets === 'object' && secrets !== null && key in secrets) {
          return secrets[key];
        }
        return response.SecretString;
      } catch {
        return response.SecretString;
      }
    }

    throw new Error(`Secret "${key}" not found in AWS Secrets Manager`);
  }

  private async getVaultSecret(key: string): Promise<string> {
    const vaultUrl = this.configService.get<string>('VAULT_URL');
    const vaultToken = this.configService.get<string>('VAULT_TOKEN');
    const vaultPath = this.configService.get<string>(
      'VAULT_SECRET_PATH',
      'secret/data/harvest-finance',
    );

    if (!vaultUrl || !vaultToken) {
      throw new Error('Vault configuration missing (VAULT_URL or VAULT_TOKEN)');
    }

    const response = await axios.get(`${vaultUrl}/v1/${vaultPath}`, {
      headers: { 'X-Vault-Token': vaultToken },
    });

    const data = response.data?.data?.data || response.data?.data;
    if (data && typeof data === 'object' && data[key]) {
      return data[key];
    }

    throw new Error(`Secret "${key}" not found in Vault path ${vaultPath}`);
  }
}
