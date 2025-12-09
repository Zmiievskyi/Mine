import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateGpuTypeEnum1733760005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new enum value A100
    await queryRunner.query(
      `ALTER TYPE "node_requests_gpu_type_enum" ADD VALUE IF NOT EXISTS 'A100'`,
    );

    // Update any existing records with old GPU types
    await queryRunner.query(
      `UPDATE "node_requests" SET "gpu_type" = 'A100' WHERE "gpu_type" IN ('3080', '4090')`,
    );

    // Note: PostgreSQL doesn't allow removing enum values directly
    // The old values (3080, 4090) will remain in the enum but won't be used
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add back old enum values if needed
    await queryRunner.query(
      `ALTER TYPE "node_requests_gpu_type_enum" ADD VALUE IF NOT EXISTS '3080'`,
    );
    await queryRunner.query(
      `ALTER TYPE "node_requests_gpu_type_enum" ADD VALUE IF NOT EXISTS '4090'`,
    );
  }
}
