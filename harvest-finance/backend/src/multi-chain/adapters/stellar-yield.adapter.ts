import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Deposit, DepositStatus } from '../../database/entities/deposit.entity';
import { Vault } from '../../database/entities/vault.entity';
import {
  AdapterHealth,
  ChainAdapter,
  ChainDeposit,
  ChainVault,
  ChainYield,
} from '../interfaces/chain-adapter.interface';

/**
 * Stellar implementation of `ChainAdapter`. Reads confirmed vault deposits
 * from the application database — the ground-truth of what the user has
 * locked in Harvest's Stellar vaults — and reports each vault as a position.
 *
 * No on-chain calls are made here: aggregating principals across many
 * vaults via Horizon would be slow and redundant given we already index
 * deposits in Postgres.
 */
@Injectable()
export class StellarYieldAdapter implements ChainAdapter {
  readonly chain = 'stellar';

  constructor(
    @InjectRepository(Deposit)
    private readonly deposits: Repository<Deposit>,
    @InjectRepository(Vault)
    private readonly vaults: Repository<Vault>,
  ) {}

  async getVaults(): Promise<ChainVault[]> {
    const vaults = await this.vaults.find();
    return vaults.map((vault) => ({
      id: vault.id,
      name: vault.vaultName,
      assetCode: 'XLM',
      apr: vault.interestRate != null ? Number(vault.interestRate) : null,
      tvl: null,
    }));
  }

  async getDeposits(userId?: string): Promise<ChainDeposit[]> {
    if (!userId) return [];
    const yields = await this.getYieldsForUser(userId);
    return yields.map((position) => ({
      vaultId: position.positionId,
      owner: userId,
      amount: position.principal,
      assetCode: position.asset.code,
    }));
  }

  async getAPY(vaultId?: string): Promise<number | null> {
    const vault = vaultId ? await this.vaults.findOne({ where: { id: vaultId } }) : null;
    return vault?.interestRate != null ? Number(vault.interestRate) : null;
  }

  async getTVL(_vaultId?: string): Promise<string> { return '0'; }

  supportsChain(chain: string): boolean { return chain.toLowerCase() === this.chain; }

  async healthCheck(): Promise<AdapterHealth> {
    const checkedAt = new Date().toISOString();
    const started = Date.now();
    try {
      await this.vaults.find({ take: 1 });
      return { chain: this.chain, status: 'healthy', checkedAt, latencyMs: Date.now() - started };
    } catch (error) {
      return { chain: this.chain, status: 'offline', checkedAt, latencyMs: Date.now() - started, message: error instanceof Error ? error.message : 'health check failed' };
    }
  }

  async getYieldsForUser(userId: string): Promise<ChainYield[]> {
    try {
      const rows = await this.deposits
        .createQueryBuilder('deposit')
        .select('deposit.vaultId', 'vaultId')
        .addSelect('SUM(deposit.amount)', 'principal')
        .where('deposit.userId = :userId', { userId })
        .andWhere('deposit.status = :status', {
          status: DepositStatus.CONFIRMED,
        })
        .groupBy('deposit.vaultId')
        .getRawMany<{ vaultId: string; principal: string }>();

      const validRows = rows.filter(
        (row) => row.vaultId && row.principal && Number.isFinite(Number(row.principal)),
      );
      if (validRows.length === 0) return [];

      const vaultIds = validRows.map((r) => r.vaultId);
      const vaults = await this.vaults.find({ where: { id: In(vaultIds) } });
      const vaultMap = new Map(vaults.map((v) => [v.id, v]));

      return validRows.map((row): ChainYield => {
        const vault = vaultMap.get(row.vaultId);
        const principal = Number(row.principal) || 0;
        const apr =
          vault?.interestRate != null ? Number(vault.interestRate) : null;
        return {
          chain: this.chain,
          positionId: row.vaultId,
          positionName: vault?.vaultName ?? 'Unknown Vault',
          principal: principal.toFixed(7),
          asset: { code: 'XLM', issuer: null },
          apr,
          estimatedAnnualYield:
            apr != null ? ((principal * apr) / 100).toFixed(7) : null,
          metadata: {
            vaultType: vault?.type,
          },
        };
      });
    } catch (err) {
      // Degrade gracefully when upstream data is unavailable (network/db errors)
      return [];
    }
  }
}
