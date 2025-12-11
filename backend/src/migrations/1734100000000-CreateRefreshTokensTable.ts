import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRefreshTokensTable1734100000000
  implements MigrationInterface
{
  name = 'CreateRefreshTokensTable1734100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "token_hash" varchar(64) NOT NULL,
        "device_info" varchar(255),
        "ip_address" varchar(45),
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "last_used_at" TIMESTAMP WITH TIME ZONE,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_user_id" ON "refresh_tokens"("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_token_hash" ON "refresh_tokens"("token_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_expires_at" ON "refresh_tokens"("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_expires_at"`);
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_token_hash"`);
    await queryRunner.query(`DROP INDEX "IDX_refresh_tokens_user_id"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
  }
}
