import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddPerformanceIndexes
 *
 * Materialises the @Index decorators that exist on the Vault, Deposit, and
 * SorobanEvent entities into actual PostgreSQL indexes.  The entity-level
 * decorators alone have no effect when synchronize=false, so we create the
 * indexes here with CREATE INDEX CONCURRENTLY so that the migration can run
 * on a live database without taking an exclusive table lock.
 *
 * Note: CONCURRENTLY cannot run inside a transaction, so each statement is
 * issued with autocommit semantics by temporarily disabling the QueryRunner
 * transaction wrapper.
 */
export class AddPerformanceIndexes1700000000024 implements MigrationInterface {
  name = 'AddPerformanceIndexes1700000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // CONCURRENTLY requires autocommit mode.
    await queryRunner.query('COMMIT');

    // ── Vaults ──────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_vaults_owner"
      ON "vaults" ("owner_id")
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_vaults_status"
      ON "vaults" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_vaults_is_public"
      ON "vaults" ("is_public")
    `);

    // Composite index used by the keyset-paginated public vault listing
    // (WHERE is_public = true ORDER BY created_at DESC, id)
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_vaults_public_cursor"
      ON "vaults" ("is_public", "created_at" DESC, "id" DESC)
      WHERE "is_public" = true
    `);

    // ── Deposits ─────────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_deposits_user"
      ON "deposits" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_deposits_vault"
      ON "deposits" ("vault_id")
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_deposits_status"
      ON "deposits" ("status")
    `);

    // Composite index for user vault-holdings aggregation
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_deposits_user_status"
      ON "deposits" ("user_id", "status")
    `);

    // Keyset pagination index for transaction history
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_deposits_vault_cursor"
      ON "deposits" ("vault_id", "created_at" DESC, "id" DESC)
    `);

    // ── Soroban Events ───────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_soroban_events_timestamp"
      ON "soroban_events" ("timestamp" DESC)
    `);

    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_soroban_events_contract_id"
      ON "soroban_events" ("contract_id")
    `);

    // ── Notifications ────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_user_read"
      ON "notifications" ("user_id", "is_read")
      WHERE "is_read" = false
    `);

    // ── Withdrawals ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_withdrawals_vault_cursor"
      ON "withdrawals" ("vault_id", "created_at" DESC, "id" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('COMMIT');

    const indexes = [
      'idx_vaults_owner',
      'idx_vaults_status',
      'idx_vaults_is_public',
      'idx_vaults_public_cursor',
      'idx_deposits_user',
      'idx_deposits_vault',
      'idx_deposits_status',
      'idx_deposits_user_status',
      'idx_deposits_vault_cursor',
      'idx_soroban_events_timestamp',
      'idx_soroban_events_contract_id',
      'idx_notifications_user_read',
      'idx_withdrawals_vault_cursor',
    ];

    for (const idx of indexes) {
      await queryRunner.query(
        `DROP INDEX CONCURRENTLY IF EXISTS "${idx}"`,
      );
    }
  }
}
