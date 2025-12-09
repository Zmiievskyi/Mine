import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateNodeStatsCacheTable1733760001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'node_stats_cache',
        columns: [
          {
            name: 'node_id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'earnings_day',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'earnings_total',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'uptime_percent',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'tokens_per_sec',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'jobs_day',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'active_model',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'voting_weight',
            type: 'decimal',
            precision: 20,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'source',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'fetched_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'node_stats_cache',
      new TableForeignKey({
        columnNames: ['node_id'],
        referencedTableName: 'nodes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create index on fetched_at
    await queryRunner.query(`
      CREATE INDEX idx_node_stats_fetched ON node_stats_cache(fetched_at)
    `);

    // Create index on status for filtering
    await queryRunner.query(`
      CREATE INDEX idx_node_stats_status ON node_stats_cache(status)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_node_stats_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_node_stats_fetched`);
    await queryRunner.dropTable('node_stats_cache');
  }
}
