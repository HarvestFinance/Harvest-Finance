import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import {
  AdapterHealth,
  ChainAdapter,
  ChainDeposit,
  ChainVault,
  ChainYield,
} from '../interfaces/chain-adapter.interface';

/**
 * Ethereum L1 implementation of `ChainAdapter`. Reads ERC-20 vault token balances
 * via ethers.js and maps them to `ChainYield` positions for users with a
 * linked `ethereumAddress`.
 */
@Injectable()
export class EthereumYieldAdapter implements ChainAdapter {
  readonly chain = 'ethereum';

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly config: ConfigService,
  ) {}

  async getVaults(): Promise<ChainVault[]> {
    return this.parseVaultConfigs(this.config.get<string>('ETHEREUM_VAULT_CONFIGS')).map((vault) => ({ id: vault.vaultAddress, name: vault.name, assetCode: vault.assetCode, apr: vault.apr, tvl: null }));
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
    if (!this.config.get<string>('ETHEREUM_RPC_URL')) return { chain: this.chain, status: 'offline', checkedAt, message: 'ETHEREUM_RPC_URL is not configured' };
    try {
      const provider = new ethers.JsonRpcProvider(this.config.get<string>('ETHEREUM_RPC_URL'));
      await provider.getBlockNumber();
      return { chain: this.chain, status: 'healthy', checkedAt };
    } catch (error) {
      return { chain: this.chain, status: 'offline', checkedAt, message: error instanceof Error ? error.message : 'RPC health check failed' };
    }
  }

  async getYieldsForUser(userId: string): Promise<ChainYield[]> {
    try {
      const wallet = await this.resolveWallet(userId);
      if (!wallet) return [];

      const rpcUrl = this.config.get<string>('ETHEREUM_RPC_URL');
      if (!rpcUrl) return [];

      const vaultConfigs = this.parseVaultConfigs(
        this.config.get<string>('ETHEREUM_VAULT_CONFIGS'),
      );
      if (vaultConfigs.length === 0) return [];

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const yields: ChainYield[] = [];

      for (const vault of vaultConfigs) {
        try {
          const contract = new ethers.Contract(
            vault.vaultAddress,
            ['function balanceOf(address) view returns (uint256)'],
            provider,
          );

          const balance = await contract.balanceOf(wallet);
          const principal = Number(ethers.formatUnits(balance, vault.decimals));

          if (principal <= 0) continue;

          yields.push({
            chain: this.chain,
            positionId: vault.vaultAddress,
            positionName: vault.name,
            principal: principal.toFixed(7),
            asset: {
              code: vault.assetCode,
              issuer: vault.vaultAddress,
            },
            apr: vault.apr ?? null,
            estimatedAnnualYield:
              vault.apr != null
                ? ((principal * vault.apr) / 100).toFixed(7)
                : null,
            metadata: {
              vaultAddress: vault.vaultAddress,
              decimals: vault.decimals,
            },
          });
        } catch {
          continue;
        }
      }

      return yields;
    } catch {
      return [];
    }
  }

  private async resolveWallet(userId: string): Promise<string | null> {
    const user = await this.users.findOne({
      where: { id: userId },
      select: ['id', 'ethereumAddress'],
    });
    const address = (user as any)?.ethereumAddress?.trim();
    return address && address.length > 0 ? address : null;
  }

  private parseVaultConfigs(
    configStr: string | undefined,
  ): Array<{
    vaultAddress: string;
    name: string;
    assetCode: string;
    decimals: number;
    apr: number | null;
  }> {
    if (!configStr) return [];

    try {
      const configs = JSON.parse(configStr);
      return Array.isArray(configs) ? configs : [];
    } catch {
      return [];
    }
  }
}
