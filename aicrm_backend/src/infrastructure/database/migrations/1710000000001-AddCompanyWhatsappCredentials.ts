import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyWhatsappCredentials1710000000001 implements MigrationInterface {
  name = 'AddCompanyWhatsappCredentials1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE company_whatsapp_credentials (
        id varchar(36) PRIMARY KEY,
        company_id varchar(36) NOT NULL UNIQUE,
        phone_number_id varchar(255) NOT NULL UNIQUE,
        business_account_id varchar(255) NOT NULL,
        app_id varchar(255) NULL,
        access_token text NOT NULL,
        verify_token varchar(255) NOT NULL,
        app_secret text NULL,
        is_active tinyint NOT NULL DEFAULT 1,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_company_whatsapp_credentials_company
          FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_company_whatsapp_credentials_company_id
      ON company_whatsapp_credentials (company_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_company_whatsapp_credentials_phone_number_id
      ON company_whatsapp_credentials (phone_number_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IDX_company_whatsapp_credentials_phone_number_id ON company_whatsapp_credentials',
    );
    await queryRunner.query(
      'DROP INDEX IDX_company_whatsapp_credentials_company_id ON company_whatsapp_credentials',
    );
    await queryRunner.query('DROP TABLE company_whatsapp_credentials');
  }
}
