import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceCustomerConversationalProfile1710000000005
  implements MigrationInterface
{
  name = 'EnhanceCustomerConversationalProfile1710000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers
      MODIFY COLUMN name varchar(255) NULL,
      MODIFY COLUMN phone varchar(50) NULL,
      MODIFY COLUMN email varchar(255) NULL,
      MODIFY COLUMN identificationType varchar(50) NULL,
      MODIFY COLUMN identificationNumber varchar(50) NULL,
      ADD COLUMN firstName varchar(120) NULL,
      ADD COLUMN lastName varchar(120) NULL,
      ADD COLUMN fullName varchar(255) NULL,
      ADD COLUMN address varchar(255) NULL,
      ADD COLUMN city varchar(120) NULL,
      ADD COLUMN age int NULL,
      ADD COLUMN metadata_json json NULL,
      ADD COLUMN onboardingCompleted tinyint NOT NULL DEFAULT 0,
      ADD COLUMN onboardingStep varchar(50) NULL,
      ADD COLUMN profileCompletionPercentage int NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE customers
      DROP COLUMN profileCompletionPercentage,
      DROP COLUMN onboardingStep,
      DROP COLUMN onboardingCompleted,
      DROP COLUMN metadata_json,
      DROP COLUMN age,
      DROP COLUMN city,
      DROP COLUMN address,
      DROP COLUMN fullName,
      DROP COLUMN lastName,
      DROP COLUMN firstName,
      MODIFY COLUMN name varchar(255) NOT NULL,
      MODIFY COLUMN phone varchar(50) NOT NULL,
      MODIFY COLUMN email varchar(255) NOT NULL
    `);
  }
}
