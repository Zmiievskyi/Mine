import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKycFields1734200000000 implements MigrationInterface {
  name = 'AddKycFields1734200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create KYC status enum type
    await queryRunner.query(`
      CREATE TYPE "users_kyc_status_enum" AS ENUM ('not_submitted', 'pending', 'verified', 'rejected')
    `);

    // Add KYC status column with default
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "kyc_status" "users_kyc_status_enum" NOT NULL DEFAULT 'not_submitted'
    `);

    // Add KYC data JSON column
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "kyc_data" JSONB
    `);

    // Add KYC timestamps
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "kyc_submitted_at" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "kyc_verified_at" TIMESTAMP WITH TIME ZONE
    `);

    // Add rejection reason
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "kyc_rejection_reason" TEXT
    `);

    // Create index for KYC status filtering
    await queryRunner.query(`
      CREATE INDEX "IDX_users_kyc_status" ON "users" ("kyc_status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_kyc_status"`);

    // Drop columns
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "kyc_rejection_reason"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "kyc_verified_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "kyc_submitted_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "kyc_data"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "kyc_status"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE IF EXISTS "users_kyc_status_enum"`);
  }
}
