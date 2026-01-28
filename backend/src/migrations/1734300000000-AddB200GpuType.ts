import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddB200GpuType1734300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add B200 GPU type to pricing_config
    await queryRunner.query(`
      INSERT INTO pricing_config (gpu_type, price_per_hour, is_contact_sales, display_order)
      VALUES ('B200', 3.50, false, 4)
      ON CONFLICT (gpu_type) DO NOTHING
    `);

    // Update existing prices to match gnk.revops.it.com (USD)
    await queryRunner.query(`
      UPDATE pricing_config SET price_per_hour = 0.99 WHERE gpu_type = 'A100';
      UPDATE pricing_config SET price_per_hour = 1.70 WHERE gpu_type = 'H100';
      UPDATE pricing_config SET price_per_hour = 2.30, is_contact_sales = false WHERE gpu_type = 'H200';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove B200
    await queryRunner.query(`
      DELETE FROM pricing_config WHERE gpu_type = 'B200'
    `);

    // Revert prices to original EUR values
    await queryRunner.query(`
      UPDATE pricing_config SET price_per_hour = 1.67 WHERE gpu_type = 'A100';
      UPDATE pricing_config SET price_per_hour = 2.76 WHERE gpu_type = 'H100';
      UPDATE pricing_config SET price_per_hour = NULL, is_contact_sales = true WHERE gpu_type = 'H200';
    `);
  }
}
