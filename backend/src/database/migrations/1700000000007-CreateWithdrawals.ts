import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateWithdrawals1700000000007 implements MigrationInterface {
  name = 'CreateWithdrawals1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create withdrawals table
    await queryRunner.createTable(
      new Table({
        name: 'withdrawals',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'vault_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'CONFIRMED', 'FAILED'],
            default: "'PENDING'",
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 18,
            scale: 8,
            isNullable: false,
          },
          {
            name: 'transaction_hash',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'confirmed_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('withdrawals');
  }
}
