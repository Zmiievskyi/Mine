import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTelegramAuth1734000000000 implements MigrationInterface {
  name = 'AddTelegramAuth1734000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add TELEGRAM to auth_provider enum
    await queryRunner.query(`
      ALTER TYPE "users_provider_enum" ADD VALUE IF NOT EXISTS 'telegram'
    `);

    // Make email nullable (for Telegram users who don't have email)
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL
    `);

    // Add Telegram-specific columns
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "telegram_id" VARCHAR UNIQUE
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "telegram_username" VARCHAR
    `);

    // Create index for Telegram ID lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_users_telegram_id" ON "users" ("telegram_id") WHERE "telegram_id" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_telegram_id"`);

    // Drop Telegram columns
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegram_username"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "telegram_id"`);

    // Make email NOT NULL again (will fail if there are users without email)
    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL
    `);

    // Note: Cannot remove enum value in PostgreSQL without recreating the type
    // The 'telegram' value will remain in the enum
  }
}
