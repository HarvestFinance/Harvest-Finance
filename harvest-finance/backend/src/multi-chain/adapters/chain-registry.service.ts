import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  AdapterHealth,
  ChainAdapter,
  CHAIN_ADAPTERS,
} from '../interfaces/chain-adapter.interface';

@Injectable()
export class ChainRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ChainRegistryService.name);
  private readonly adapters = new Map<string, ChainAdapter>();
  private readonly health = new Map<string, AdapterHealth>();

  constructor(@Inject(CHAIN_ADAPTERS) initialAdapters: ChainAdapter[]) {
    initialAdapters.forEach((adapter) => this.register(adapter));
  }

  async onModuleInit(): Promise<void> {
    await Promise.all(
      [...this.adapters.values()].map(async (adapter) => {
        const result = await this.check(adapter);
        this.health.set(adapter.chain, result);
      }),
    );
  }

  register(adapter: ChainAdapter): void {
    const chain = adapter.chain.toLowerCase();
    if (this.adapters.has(chain)) {
      throw new Error(`An adapter is already registered for chain '${chain}'`);
    }
    this.adapters.set(chain, adapter);
  }

  unregister(chain: string): boolean {
    this.health.delete(chain.toLowerCase());
    return this.adapters.delete(chain.toLowerCase());
  }

  get(chain: string): ChainAdapter | undefined {
    return this.adapters.get(chain.toLowerCase());
  }

  getAll(): ChainAdapter[] {
    return [...this.adapters.values()];
  }

  private refreshPromise: Promise<AdapterHealth[]> | null = null;

  async refreshHealth(): Promise<AdapterHealth[]> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        await Promise.all(
          [...this.adapters.values()].map(async (adapter) => {
            this.health.set(adapter.chain, await this.check(adapter));
          }),
        );
        return this.getHealth();
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  getHealth(): AdapterHealth[] {
    return [...this.adapters.keys()].map(
      (chain) =>
        this.health.get(chain) ?? {
          chain,
          status: 'offline',
          checkedAt: new Date().toISOString(),
          message: 'Health check has not completed',
        },
    );
  }

  private async check(adapter: ChainAdapter): Promise<AdapterHealth> {
    try {
      return await adapter.healthCheck();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'health check failed';
      this.logger.warn(`Health check failed for '${adapter.chain}': ${message}`);
      return {
        chain: adapter.chain,
        status: 'offline',
        checkedAt: new Date().toISOString(),
        message,
      };
    }
  }
}
