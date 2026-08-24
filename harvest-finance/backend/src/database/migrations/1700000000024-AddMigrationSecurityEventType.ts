import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMigrationSecurityEventType1700000000024 implements MigrationInterface {
  name = 'AddMigrationSecurityEventType1700000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "security_events_type_enum" ADD VALUE IF NOT EXISTS 'MIGRATION_CREATED'`);
  }

  public async down(): Promise<void> {
    // PostgreSQL does not support removing an enum value safely in place.
  }
}