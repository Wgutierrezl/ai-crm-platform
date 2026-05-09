import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyAssistantConfig1710000000010
  implements MigrationInterface
{
  name = 'AddCompanyAssistantConfig1710000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
      ADD COLUMN assistant_name varchar(100) NULL,
      ADD COLUMN assistant_context text NULL,
      ADD COLUMN assistant_welcome_message text NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
      DROP COLUMN assistant_welcome_message,
      DROP COLUMN assistant_context,
      DROP COLUMN assistant_name
    `);
  }
}
