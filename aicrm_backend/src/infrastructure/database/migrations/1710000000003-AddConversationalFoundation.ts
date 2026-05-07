import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConversationalFoundation1710000000003
  implements MigrationInterface
{
  name = 'AddConversationalFoundation1710000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE company_whatsapp_apps
      ADD COLUMN company_id varchar(36) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_company_whatsapp_apps_company_id
      ON company_whatsapp_apps (company_id)
    `);

    await queryRunner.query(`
      CREATE TABLE external_identities (
        id varchar(36) PRIMARY KEY,
        company_id varchar(36) NOT NULL,
        channel varchar(30) NOT NULL,
        external_user_id varchar(120) NOT NULL,
        phone varchar(50) NULL,
        customer_id varchar(36) NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_external_identities_company FOREIGN KEY (company_id) REFERENCES companies(id),
        CONSTRAINT FK_external_identities_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
        CONSTRAINT UQ_external_identity_company_channel_external UNIQUE (company_id, channel, external_user_id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_external_identities_company_customer
      ON external_identities (company_id, customer_id)
    `);

    await queryRunner.query(`
      CREATE TABLE conversation_states (
        id varchar(36) PRIMARY KEY,
        conversation_id varchar(36) NOT NULL UNIQUE,
        company_id varchar(36) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'active',
        registration_step varchar(30) NOT NULL DEFAULT 'awaiting_name',
        context_json json NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_conversation_states_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id),
        CONSTRAINT FK_conversation_states_company FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);

    await queryRunner.query(`
      ALTER TABLE messages
      ADD COLUMN source_channel varchar(30) NOT NULL DEFAULT 'api',
      ADD COLUMN channel_message_id varchar(120) NULL,
      ADD COLUMN metadata_json json NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_messages_company_channel_message
      ON messages (companyId, source_channel, channel_message_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IDX_messages_company_channel_message ON messages',
    );
    await queryRunner.query(`
      ALTER TABLE messages
      DROP COLUMN metadata_json,
      DROP COLUMN channel_message_id,
      DROP COLUMN source_channel
    `);

    await queryRunner.query('DROP TABLE conversation_states');

    await queryRunner.query(
      'DROP INDEX IDX_external_identities_company_customer ON external_identities',
    );
    await queryRunner.query('DROP TABLE external_identities');

    await queryRunner.query(
      'DROP INDEX IDX_company_whatsapp_apps_company_id ON company_whatsapp_apps',
    );
    await queryRunner.query(`
      ALTER TABLE company_whatsapp_apps
      DROP COLUMN company_id
    `);
  }
}
