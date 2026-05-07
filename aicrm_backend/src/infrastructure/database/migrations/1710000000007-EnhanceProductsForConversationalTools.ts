import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceProductsForConversationalTools1710000000007
  implements MigrationInterface
{
  name = 'EnhanceProductsForConversationalTools1710000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN description text NULL,
      ADD COLUMN isActive tinyint NOT NULL DEFAULT 1,
      ADD COLUMN sku varchar(80) NULL,
      ADD COLUMN brand varchar(120) NULL,
      ADD COLUMN features_json json NULL,
      ADD COLUMN tags_json json NULL,
      ADD COLUMN imageUrl varchar(500) NULL,
      ADD COLUMN currency varchar(10) NOT NULL DEFAULT 'COP',
      ADD COLUMN minStock int NOT NULL DEFAULT 0,
      ADD COLUMN metadata_json json NULL,
      ADD COLUMN createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN updatedAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN updatedAt,
      DROP COLUMN createdAt,
      DROP COLUMN metadata_json,
      DROP COLUMN minStock,
      DROP COLUMN currency,
      DROP COLUMN imageUrl,
      DROP COLUMN tags_json,
      DROP COLUMN features_json,
      DROP COLUMN brand,
      DROP COLUMN sku,
      DROP COLUMN isActive,
      DROP COLUMN description
    `);
  }
}
