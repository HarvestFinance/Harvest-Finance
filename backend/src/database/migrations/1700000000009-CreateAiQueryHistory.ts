import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAiQueryHistory1700000000009 implements MigrationInterface {
  name = 'CreateAiQueryHistory1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'ai_query_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'query', type: 'text' },
          { name: 'response', type: 'text' },
          { name: 'vault_context', type: 'jsonb', isNullable: true },
          { name: 'seasonal_data', type: 'jsonb', isNullable: true },
          { name: 'user_id', type: 'uuid' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'ai_query_history',
      new TableIndex({
        name: 'IDX_AI_QUERY_HISTORY_USER_CREATED',
        columnNames: ['user_id', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'ai_query_history',
      'IDX_AI_QUERY_HISTORY_USER_CREATED',
    );
    await queryRunner.dropTable('ai_query_history');
  }
}
