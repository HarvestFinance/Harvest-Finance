import { Logger as TypeOrmLoggerInterface, QueryRunner } from 'typeorm';
import { CustomLoggerService } from '../logger/custom-logger.service';

export class TypeOrmLogger implements TypeOrmLoggerInterface {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly slowQueryThresholdMs: number = 100
  ) {}

  logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    // Only logging slow queries or errors in production
  }

  logQueryError(error: string | Error, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    this.logger.error(
      { event: 'db_query_error', query, parameters, err: error instanceof Error ? error.message : error },
      error instanceof Error ? error.stack : undefined,
      'Database'
    );
  }

  logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    if (time > this.slowQueryThresholdMs) {
      this.logger.warn({ event: 'db_slow_query', query, durationMs: time }, 'Database');
    }
  }

  logSchemaBuild(message: string, queryRunner?: QueryRunner) {
    this.logger.log({ event: 'db_schema_build', message }, 'Database');
  }

  logMigration(message: string, queryRunner?: QueryRunner) {
    this.logger.log({ event: 'db_migration', message }, 'Database');
  }

  log(level: 'log' | 'info' | 'warn', message: any, queryRunner?: QueryRunner) {
    if (level === 'log' || level === 'info') {
      this.logger.log({ event: 'db_log', message }, 'Database');
    } else if (level === 'warn') {
      this.logger.warn({ event: 'db_warn', message }, 'Database');
    }
  }
}
