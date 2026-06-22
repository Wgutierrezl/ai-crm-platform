import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyBrandingLogo1710000000018 implements MigrationInterface {
  name = 'AddCompanyBrandingLogo1710000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
      ADD COLUMN logo_url varchar(2048) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE companies
      DROP COLUMN logo_url
    `);
  }
}
