import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1733850000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add email verification columns
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "emailVerified" boolean NOT NULL DEFAULT false,
      ADD COLUMN "verificationCode" varchar(6),
      ADD COLUMN "verificationCodeExpiresAt" TIMESTAMP WITH TIME ZONE,
      ADD COLUMN "verificationAttempts" integer NOT NULL DEFAULT 0,
      ADD COLUMN "verificationLockedUntil" TIMESTAMP WITH TIME ZONE
    `);

    // Update existing OAuth users to have verified emails
    await queryRunner.query(`
      UPDATE "users"
      SET "emailVerified" = true
      WHERE "provider" IN ('google', 'github')
    `);

    // Create index for verificationCodeExpiresAt to optimize cleanup queries
    await queryRunner.query(`
      CREATE INDEX "idx_users_verification_code_expires_at"
      ON "users"("verificationCodeExpiresAt")
      WHERE "verificationCodeExpiresAt" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_users_verification_code_expires_at"
    `);

    // Drop columns
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "verificationLockedUntil",
      DROP COLUMN IF EXISTS "verificationAttempts",
      DROP COLUMN IF EXISTS "verificationCodeExpiresAt",
      DROP COLUMN IF EXISTS "verificationCode",
      DROP COLUMN IF EXISTS "emailVerified"
    `);
  }
}
