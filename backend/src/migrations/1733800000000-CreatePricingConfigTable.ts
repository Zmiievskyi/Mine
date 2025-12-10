import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreatePricingConfigTable1733800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pricing_config',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'gpu_type',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'price_per_hour',
            type: 'decimal',
            precision: 10,
            scale: 4,
            isNullable: true,
          },
          {
            name: 'is_contact_sales',
            type: 'boolean',
            default: false,
          },
          {
            name: 'display_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'updated_by',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'NOW()',
          },
        ],
      }),
      true,
    );

    // Add foreign key to users table
    await queryRunner.createForeignKey(
      'pricing_config',
      new TableForeignKey({
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Seed initial pricing data
    await queryRunner.query(`
      INSERT INTO pricing_config (gpu_type, price_per_hour, is_contact_sales, display_order)
      VALUES
        ('A100', 1.67, false, 1),
        ('H100', 2.76, false, 2),
        ('H200', NULL, true, 3)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pricing_config');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('updated_by') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('pricing_config', foreignKey);
    }
    await queryRunner.dropTable('pricing_config');
  }
}
