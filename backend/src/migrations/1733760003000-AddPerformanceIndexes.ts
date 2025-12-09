import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPerformanceIndexes1733760003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add indexes to user_nodes table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_nodes_user_id ON user_nodes(user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_user_nodes_active ON user_nodes(is_active) WHERE is_active = true
    `);

    // Add indexes to node_requests table
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_requests_user_id ON node_requests(user_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_requests_status ON node_requests(status)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_requests_created_at ON node_requests(created_at DESC)
    `);

    // Add indexes to users table for common queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_is_active ON users("isActive") WHERE "isActive" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes in reverse order
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_is_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_role`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_requests_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_requests_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_requests_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_nodes_active`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_user_nodes_user_id`);
  }
}
