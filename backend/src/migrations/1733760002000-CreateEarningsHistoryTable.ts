import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateEarningsHistoryTable1733760002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'earnings_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'node_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'earnings_gnk',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: false,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'earnings_history',
      new TableForeignKey({
        columnNames: ['node_id'],
        referencedTableName: 'nodes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add unique constraint on (node_id, date)
    await queryRunner.query(`
      ALTER TABLE earnings_history
      ADD CONSTRAINT uq_earnings_node_date UNIQUE (node_id, date)
    `);

    // Create composite index on (node_id, date DESC) for queries
    await queryRunner.query(`
      CREATE INDEX idx_earnings_node_date ON earnings_history(node_id, date DESC)
    `);

    // Create index on date for time-based queries
    await queryRunner.query(`
      CREATE INDEX idx_earnings_date ON earnings_history(date DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_earnings_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_earnings_node_date`);
    await queryRunner.dropTable('earnings_history');
  }
}
