import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, PublicKey } from '@solana/web3.js';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import {
  AdapterHealth,
  ChainAdapter,
  ChainDeposit,
  ChainVault,
  ChainYield,
} from '../interfaces/chain-adapter.interface';
import {
  parseSolanaVaultStrategies,
  SolanaVaultStrategy,
} from './solana-vault.strategy';

/** SPL Token program — used to scope parsed token account lookups. */
const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

/**
 * Solana implementation of `ChainAdapter`. Reads SPL token balances for
 * configured vault mints via `@solana/web3.js` and maps them to `ChainYield`
 * positions for users with a linked `solanaAddress`.
 */
@Injectable()
export class SolanaYieldAdapter implements ChainAdapter {
  readonly chain = 'solana';

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async getVaults(): Promise<ChainVault[]> {
    return parseSolanaVaultStrategies(this.config.get<string>('SOLANA_VAULT_STRATEGIES')).map((strategy) => ({ id: strategy.mint, name: strategy.name, assetCode: strategy.assetCode, apr: strategy.apr, tvl: null }));
  }

  async getDeposits(userId?: string): Promise<ChainDeposit[]> {
    if (!userId) return [];
    return (await this.getYieldsForUser(userId)).map((position) => ({ vaultId: position.positionId, owner: userId, amount: position.principal, assetCode: position.asset.code }));
  }

  async getAPY(vaultId?: string): Promise<number | null> { return (await this.getVaults()).find((vault) => vault.id === vaultId)?.apr ?? null; }

  async getTVL(_vaultId?: string): Promise<string> { return '0'; }

  supportsChain(chain: string): boolean { return chain.toLowerCase() === this.chain; }

  async healthCheck(): Promise<AdapterHealth> {
    const checkedAt = new Date().toISOString();
    if (!this.config.get<string>('SOLANA_RPC_URL')) return { chain: this.chain, status: 'offline', checkedAt, message: 'SOLANA_RPC_URL is not configured' };
    try {
      await new Connection(this.config.get<string>('SOLANA_RPC_URL'), 'confirmed').getEpochInfo();
      return { chain: this.chain, status: 'healthy', checkedAt };
    } catch (error) {
      return { chain: this.chain, status: 'offline', checkedAt, message: error instanceof Error ? error.message : 'RPC health check failed' };
    }
  }

  async getYieldsForUser(userId: string): Promise<ChainYield[]> {
    try {
      const wallet = await this.resolveWallet(userId);
      if (!wallet) return [];

      const rpcUrl = this.config.get<string>('SOLANA_RPC_URL');
      if (!rpcUrl) return [];

      const strategies = parseSolanaVaultStrategies(
        this.config.get<string>('SOLANA_VAULT_STRATEGIES'),
      );
      if (strategies.length === 0) return [];

      const strategyByMint = new Map(
        strategies.map((s) => [s.mint, s] as const),
      );

      const connection = new Connection(rpcUrl, 'confirmed');
      const owner = new PublicKey(wallet);

      const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID,
      });

      const yields: ChainYield[] = [];

      for (const { pubkey, account } of accounts.value) {
        const parsed = account.data;
        if (!('parsed' in parsed) || parsed.parsed?.type !== 'account') {
          continue;
        }

        const info = parsed.parsed.info as {
          mint?: string;
          tokenAmount?: {
            uiAmountString?: string;
            amount?: string;
            decimals?: number;
          };
        };

        const mint = info.mint;
        if (!mint) continue;

        const strategy = strategyByMint.get(mint);
        if (!strategy) continue;

        const principal = this.formatPrincipal(info.tokenAmount);
        if (principal === '0') continue;

        const apr = strategy.apr ?? null;
        yields.push(
          this.toChainYield(strategy, pubkey.toBase58(), principal, apr),
        );
      }

      return yields;
    } catch {
      return [];
    }
  }

  private async resolveWallet(userId: string): Promise<string | null> {
    const user = await this.users.findOne({
      where: { id: userId },
      select: ['id', 'solanaAddress'],
    });
    const address = user?.solanaAddress?.trim();
    return address && address.length > 0 ? address : null;
  }

  private formatPrincipal(
    tokenAmount?: {
      uiAmountString?: string;
      amount?: string;
      decimals?: number;
    },
  ): string {
    if (tokenAmount?.uiAmountString != null) {
      const ui = Number(tokenAmount.uiAmountString);
      if (!Number.isNaN(ui) && ui > 0) {
        return ui.toFixed(7);
      }
    }

    if (tokenAmount?.amount != null && tokenAmount.decimals != null) {
      const raw = BigInt(tokenAmount.amount);
      const divisor = 10n ** BigInt(tokenAmount.decimals);
      const whole = raw / divisor;
      const frac = raw % divisor;
      const fracStr = frac
        .toString()
        .padStart(tokenAmount.decimals, '0')
        .slice(0, 7)
        .padEnd(7, '0');
      const combined = `${whole}.${fracStr}`;
      const num = Number(combined);
      if (!Number.isNaN(num) && num > 0) {
        return num.toFixed(7);
      }
    }

    return '0';
  }

  private toChainYield(
    strategy: SolanaVaultStrategy,
    tokenAccount: string,
    principal: string,
    apr: number | null,
  ): ChainYield {
    const principalNum = Number(principal) || 0;
    return {
      chain: this.chain,
      positionId: `${strategy.mint}:${tokenAccount}`,
      positionName: strategy.name,
      principal,
      asset: {
        code: strategy.assetCode,
        issuer: strategy.mint,
      },
      apr,
      estimatedAnnualYield:
        apr != null ? ((principalNum * apr) / 100).toFixed(7) : null,
      metadata: {
        tokenAccount,
        mint: strategy.mint,
      },
    };
  }
}
