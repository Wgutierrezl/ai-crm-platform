import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOauthRegistrationSessions1710000000014
  implements MigrationInterface
{
  name = 'AddOauthRegistrationSessions1710000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE oauth_registration_sessions (
        id varchar(36) NOT NULL PRIMARY KEY,
        provider varchar(30) NOT NULL,
        provider_user_id varchar(191) NOT NULL,
        email varchar(255) NOT NULL,
        email_verified tinyint NOT NULL DEFAULT 0,
        full_name varchar(255) NULL,
        picture_url varchar(500) NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        expires_at datetime NOT NULL,
        consumed_at datetime NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_oauth_reg_sessions_provider_user_status
      ON oauth_registration_sessions (provider, provider_user_id, status)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_oauth_reg_sessions_expires_at
      ON oauth_registration_sessions (expires_at)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IDX_oauth_reg_sessions_expires_at ON oauth_registration_sessions
    `);
    await queryRunner.query(`
      DROP INDEX IDX_oauth_reg_sessions_provider_user_status ON oauth_registration_sessions
    `);
    await queryRunner.query(`
      DROP TABLE oauth_registration_sessions
    `);
  }
}

