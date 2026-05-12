import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOauthIdentities1710000000013 implements MigrationInterface {
  name = 'AddOauthIdentities1710000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE oauth_identities (
        id varchar(36) NOT NULL PRIMARY KEY,
        provider varchar(30) NOT NULL,
        provider_user_id varchar(191) NOT NULL,
        user_id varchar(36) NOT NULL,
        email varchar(255) NULL,
        email_verified tinyint NOT NULL DEFAULT 0,
        display_name varchar(255) NULL,
        picture_url varchar(500) NULL,
        linked_at datetime NOT NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_oauth_identities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_oauth_identities_provider_user
      ON oauth_identities (provider, provider_user_id)
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_oauth_identities_provider_user_id
      ON oauth_identities (provider, user_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_oauth_identities_user_id
      ON oauth_identities (user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IDX_oauth_identities_user_id ON oauth_identities
    `);
    await queryRunner.query(`
      DROP INDEX UQ_oauth_identities_provider_user_id ON oauth_identities
    `);
    await queryRunner.query(`
      DROP INDEX UQ_oauth_identities_provider_user ON oauth_identities
    `);
    await queryRunner.query(`
      DROP TABLE oauth_identities
    `);
  }
}
