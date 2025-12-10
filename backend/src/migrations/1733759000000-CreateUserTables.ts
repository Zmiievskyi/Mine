import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserTables1733759000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension for UUID generation
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enums with TypeORM naming convention
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM ('user', 'admin')
    `);

    await queryRunner.query(`
      CREATE TYPE "users_provider_enum" AS ENUM ('local', 'google', 'github')
    `);

    await queryRunner.query(`
      CREATE TYPE "node_requests_gpu_type_enum" AS ENUM ('A100', 'H100', 'H200')
    `);

    await queryRunner.query(`
      CREATE TYPE "node_requests_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'completed')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" varchar(255) NOT NULL,
        "password" varchar(255),
        "name" varchar(255),
        "role" "users_role_enum" NOT NULL DEFAULT 'user',
        "provider" "users_provider_enum" NOT NULL DEFAULT 'local',
        "googleId" varchar(255),
        "githubId" varchar(255),
        "avatarUrl" varchar(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_users_googleId" UNIQUE ("googleId"),
        CONSTRAINT "UQ_users_githubId" UNIQUE ("githubId")
      )
    `);

    // Create user_nodes table
    await queryRunner.query(`
      CREATE TABLE "user_nodes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "node_address" varchar(255) NOT NULL,
        "label" varchar(255),
        "gpu_type" varchar(50),
        "gcore_instance_id" varchar(255),
        "notes" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_nodes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_nodes_node_address" UNIQUE ("node_address"),
        CONSTRAINT "FK_user_nodes_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create node_requests table
    await queryRunner.query(`
      CREATE TABLE "node_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "gpu_type" "node_requests_gpu_type_enum" NOT NULL,
        "gpu_count" integer NOT NULL DEFAULT 1,
        "region" varchar(255),
        "message" text,
        "status" "node_requests_status_enum" NOT NULL DEFAULT 'pending',
        "admin_notes" text,
        "processed_by" uuid,
        "processed_at" TIMESTAMP WITH TIME ZONE,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_node_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_node_requests_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes defined in entities
    await queryRunner.query(`
      CREATE INDEX "idx_user_nodes_user_id" ON "user_nodes"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_node_requests_user_id" ON "node_requests"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_node_requests_status" ON "node_requests"("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_requests_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_node_requests_user_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_nodes_user_id"`);

    // Drop tables in reverse order (due to foreign keys)
    await queryRunner.query(`DROP TABLE IF EXISTS "node_requests"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_nodes"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "node_requests_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "node_requests_gpu_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_provider_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
