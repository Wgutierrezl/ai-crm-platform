import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerOauthForWhatsapp1710000000015
  implements MigrationInterface
{
  name = 'AddCustomerOauthForWhatsapp1710000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE customer_oauth_link_sessions (
        id varchar(36) NOT NULL PRIMARY KEY,
        company_id varchar(36) NOT NULL,
        customer_id varchar(36) NOT NULL,
        conversation_id varchar(36) NOT NULL,
        channel varchar(30) NOT NULL,
        external_user_id varchar(120) NOT NULL,
        provider varchar(30) NOT NULL,
        state_token varchar(191) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        expires_at datetime NOT NULL,
        consumed_at datetime NULL,
        result_status varchar(30) NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_customer_oauth_link_sessions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT FK_customer_oauth_link_sessions_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT FK_customer_oauth_link_sessions_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_customer_oauth_link_sessions_state_token
      ON customer_oauth_link_sessions (state_token)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_oauth_link_sessions_company_customer_status
      ON customer_oauth_link_sessions (company_id, customer_id, status)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_oauth_link_sessions_expires_at
      ON customer_oauth_link_sessions (expires_at)
    `);

    await queryRunner.query(`
      CREATE TABLE customer_oauth_identities (
        id varchar(36) NOT NULL PRIMARY KEY,
        company_id varchar(36) NOT NULL,
        customer_id varchar(36) NOT NULL,
        provider varchar(30) NOT NULL,
        provider_user_id varchar(191) NOT NULL,
        email varchar(255) NULL,
        email_verified tinyint NOT NULL DEFAULT 0,
        display_name varchar(255) NULL,
        picture_url varchar(500) NULL,
        linked_at datetime NOT NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_customer_oauth_identities_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT FK_customer_oauth_identities_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_customer_oauth_identities_company_provider_user
      ON customer_oauth_identities (company_id, provider, provider_user_id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_customer_oauth_identities_company_provider_customer
      ON customer_oauth_identities (company_id, provider, customer_id)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_customer_oauth_identities_customer_id
      ON customer_oauth_identities (customer_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IDX_customer_oauth_identities_customer_id ON customer_oauth_identities
    `);
    await queryRunner.query(`
      DROP INDEX UQ_customer_oauth_identities_company_provider_customer ON customer_oauth_identities
    `);
    await queryRunner.query(`
      DROP INDEX UQ_customer_oauth_identities_company_provider_user ON customer_oauth_identities
    `);
    await queryRunner.query(`
      DROP TABLE customer_oauth_identities
    `);

    await queryRunner.query(`
      DROP INDEX IDX_customer_oauth_link_sessions_expires_at ON customer_oauth_link_sessions
    `);
    await queryRunner.query(`
      DROP INDEX IDX_customer_oauth_link_sessions_company_customer_status ON customer_oauth_link_sessions
    `);
    await queryRunner.query(`
      DROP INDEX UQ_customer_oauth_link_sessions_state_token ON customer_oauth_link_sessions
    `);
    await queryRunner.query(`
      DROP TABLE customer_oauth_link_sessions
    `);
  }
}

