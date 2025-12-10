import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedUserColumns1733845030000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop unused communication and preference columns
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "telegram"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "discord"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "currency_preference"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore columns if rollback is needed
    await queryRunner.query(
      `ALTER TABLE "users" ADD "currency_preference" character varying(10) NOT NULL DEFAULT 'USD'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "discord" character varying(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "telegram" character varying(100)`,
    );
  }
}
