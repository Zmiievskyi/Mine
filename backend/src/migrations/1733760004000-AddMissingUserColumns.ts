import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMissingUserColumns1733760004000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add telegram column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'telegram',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    // Add discord column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'discord',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
    );

    // Add currency_preference column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'currency_preference',
        type: 'varchar',
        length: '10',
        default: "'USD'",
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('users', 'currency_preference');
    await queryRunner.dropColumn('users', 'discord');
    await queryRunner.dropColumn('users', 'telegram');
  }
}
