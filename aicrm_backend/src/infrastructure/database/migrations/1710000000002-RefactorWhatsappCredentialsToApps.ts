import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorWhatsappCredentialsToApps1710000000002
  implements MigrationInterface
{
  name = 'RefactorWhatsappCredentialsToApps1710000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE company_whatsapp_apps (
        id int unsigned NOT NULL AUTO_INCREMENT,
        name varchar(150) NOT NULL,
        phone_number_id varchar(255) NOT NULL UNIQUE,
        business_account_id varchar(255) NOT NULL,
        app_id varchar(255) NULL,
        display_phone_number varchar(50) NULL,
        is_active tinyint NOT NULL DEFAULT 1,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_company_whatsapp_apps_phone_number_id
      ON company_whatsapp_apps (phone_number_id)
    `);

    await queryRunner.query(`
      INSERT INTO company_whatsapp_apps (
        name,
        phone_number_id,
        business_account_id,
        app_id,
        is_active,
        created_at,
        updated_at
      )
      SELECT
        CONCAT('WhatsApp App ', phone_number_id),
        phone_number_id,
        business_account_id,
        app_id,
        is_active,
        created_at,
        updated_at
      FROM company_whatsapp_credentials
    `);

    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      ADD COLUMN whatsapp_app_id int unsigned NULL
    `);

    await queryRunner.query(`
      UPDATE company_whatsapp_credentials c
      INNER JOIN company_whatsapp_apps a
        ON a.phone_number_id = c.phone_number_id
      SET c.whatsapp_app_id = a.id
    `);

    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      MODIFY COLUMN whatsapp_app_id int unsigned NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      DROP FOREIGN KEY FK_company_whatsapp_credentials_company
    `);
    await queryRunner.query(`
      DROP INDEX IDX_company_whatsapp_credentials_company_id
      ON company_whatsapp_credentials
    `);
    await queryRunner.query(`
      DROP INDEX IDX_company_whatsapp_credentials_phone_number_id
      ON company_whatsapp_credentials
    `);

    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      DROP COLUMN company_id,
      DROP COLUMN phone_number_id,
      DROP COLUMN business_account_id,
      DROP COLUMN app_id
    `);

    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      ADD CONSTRAINT UQ_company_whatsapp_credentials_whatsapp_app_id UNIQUE (whatsapp_app_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_company_whatsapp_credentials_whatsapp_app_id
      ON company_whatsapp_credentials (whatsapp_app_id)
    `);
    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      ADD CONSTRAINT FK_company_whatsapp_credentials_whatsapp_app
      FOREIGN KEY (whatsapp_app_id) REFERENCES company_whatsapp_apps(id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      ADD COLUMN company_id varchar(36) NULL,
      ADD COLUMN phone_number_id varchar(255) NULL,
      ADD COLUMN business_account_id varchar(255) NULL,
      ADD COLUMN app_id varchar(255) NULL
    `);

    await queryRunner.query(`
      UPDATE company_whatsapp_credentials c
      INNER JOIN company_whatsapp_apps a
        ON a.id = c.whatsapp_app_id
      SET c.phone_number_id = a.phone_number_id,
          c.business_account_id = a.business_account_id,
          c.app_id = a.app_id
    `);

    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      DROP FOREIGN KEY FK_company_whatsapp_credentials_whatsapp_app
    `);
    await queryRunner.query(`
      DROP INDEX IDX_company_whatsapp_credentials_whatsapp_app_id
      ON company_whatsapp_credentials
    `);
    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      DROP INDEX UQ_company_whatsapp_credentials_whatsapp_app_id
    `);

    await queryRunner.query(`
      ALTER TABLE company_whatsapp_credentials
      DROP COLUMN whatsapp_app_id
    `);

    await queryRunner.query(`
      DROP INDEX IDX_company_whatsapp_apps_phone_number_id
      ON company_whatsapp_apps
    `);
    await queryRunner.query('DROP TABLE company_whatsapp_apps');
  }
}
