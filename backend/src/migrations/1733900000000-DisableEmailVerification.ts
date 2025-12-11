import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Disable email verification
 *
 * This migration sets all existing users as email-verified and changes
 * the default value to true. This effectively disables email verification
 * until Resend domain is properly configured.
 *
 * To re-enable email verification:
 * 1. Revert this migration or create a new one that sets default to false
 * 2. Uncomment verification code in auth.service.ts
 * 3. Re-add EmailVerifiedGuard to requests.controller.ts
 */
export class DisableEmailVerification1733900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Set all existing users as verified
    await queryRunner.query(`UPDATE users SET "emailVerified" = true`);

    // Change default to true for new users
    await queryRunner.query(
      `ALTER TABLE users ALTER COLUMN "emailVerified" SET DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert default to false
    await queryRunner.query(
      `ALTER TABLE users ALTER COLUMN "emailVerified" SET DEFAULT false`,
    );

    // Note: We don't revert users to emailVerified=false as that would
    // lock out users who were legitimately verified before this migration
  }
}
