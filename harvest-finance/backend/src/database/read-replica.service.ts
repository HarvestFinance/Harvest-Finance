import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { getDatabaseConfig } from '../../database/data-source';

/**
 * ReadReplicaService
 *
 * Provides a secondary TypeORM DataSource that points to a read replica.
 * Read-heavy endpoints (vault lists, APY history, portfolio) can inject this
 * service and use `getRepository()` to offload SELECT queries from the primary.
 *
 * When no replica URL is configured (DB_READ_HOST is absent), all calls
 * transparently fall back to the primary DataSource, so the service is safe
 * to use in development without any extra setup.
 *
 * Usage:
 *   constructor(private readonly replica: ReadReplicaService) {}
 *   const repo = this.replica.getRepository(Vault);
 *   const vaults = await repo.find({ where: { isPublic: true } });
 */
@Injectable()
export class ReadReplicaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReadReplicaService.name);
  private replicaDataSource: DataSource | null = null;
  private readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    /** Primary DataSource — used as a fallback when no replica is configured. */
    private readonly primaryDataSource: DataSource,
  ) {
    this.enabled = !!this.configService.get<string>('DB_READ_HOST');
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.log(
        'DB_READ_HOST not set — read-replica routing disabled; all reads go to primary.',
      );
      return;
    }

    const base = getDatabaseConfig() as any;

    const replicaOptions: DataSourceOptions = {
      ...base,
      host: this.configService.get<string>('DB_READ_HOST'),
      port: parseInt(this.configService.get<string>('DB_READ_PORT') || '5432', 10),
      username: this.configService.get<string>('DB_READ_USER') || base.username,
      password: this.configService.get<string>('DB_READ_PASSWORD') || base.password,
      database: this.configService.get<string>('DB_READ_NAME') || base.database,
      // No migration runs on the replica — it's a hot standby.
      migrationsRun: false,
      synchronize: false,
      extra: {
        ...((base as any).extra ?? {}),
        max: parseInt(
          this.configService.get<string>('DB_READ_POOL_MAX') || '10',
          10,
        ),
        min: parseInt(
          this.configService.get<string>('DB_READ_POOL_MIN') || '1',
          10,
        ),
      },
    };

    this.replicaDataSource = new DataSource(replicaOptions);
    await this.replicaDataSource.initialize();
    this.logger.log(
      `Read-replica DataSource initialised — host=${replicaOptions.host}:${replicaOptions.port}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.replicaDataSource?.isInitialized) {
      await this.replicaDataSource.destroy();
      this.logger.log('Read-replica DataSource closed.');
    }
  }

  /**
   * Returns the replica DataSource when available, otherwise the primary.
   * This keeps all callers forward-compatible: if a replica is added later,
   * they automatically start using it without code changes.
   */
  get dataSource(): DataSource {
    if (this.replicaDataSource?.isInitialized) {
      return this.replicaDataSource;
    }
    return this.primaryDataSource;
  }

  /**
   * Get a TypeORM Repository from the replica (or primary fallback).
   */
  getRepository<T extends object>(entity: new () => T) {
    return this.dataSource.getRepository(entity);
  }
}
