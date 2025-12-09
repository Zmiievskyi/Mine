import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateNodesTable1733760000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'nodes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'identifier',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'identifier_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'gpu_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'region',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'gcore_instance_id',
            type: 'varchar',
            length: '255',
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

    // Add check constraint for identifier_type
    await queryRunner.query(`
      ALTER TABLE nodes
      ADD CONSTRAINT chk_identifier_type
      CHECK (identifier_type IN ('wallet', 'node_id', 'operator', 'validator'))
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_nodes_identifier ON nodes(identifier)
    `);
    await queryRunner.query(`
      CREATE INDEX idx_nodes_gpu_type ON nodes(gpu_type)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nodes_gpu_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_nodes_identifier`);
    await queryRunner.dropTable('nodes');
  }
}
