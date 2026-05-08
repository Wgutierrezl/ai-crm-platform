import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCategories1710000000008 implements MigrationInterface {
  name = 'AddProductCategories1710000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE categories (
        id varchar(36) PRIMARY KEY,
        company_id varchar(36) NOT NULL,
        name varchar(120) NOT NULL,
        description text NULL,
        slug varchar(160) NULL,
        is_active tinyint NOT NULL DEFAULT 1,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_categories_company FOREIGN KEY (company_id) REFERENCES companies(id)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_categories_company_name
      ON categories (company_id, name)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_categories_company_slug
      ON categories (company_id, slug)
    `);

    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN category_id varchar(36) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_products_company_category
      ON products (companyId, category_id)
    `);

    await queryRunner.query(`
      ALTER TABLE products
      ADD CONSTRAINT FK_products_category
      FOREIGN KEY (category_id) REFERENCES categories(id)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      DROP FOREIGN KEY FK_products_category
    `);

    await queryRunner.query(`
      DROP INDEX IDX_products_company_category ON products
    `);

    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN category_id
    `);

    await queryRunner.query(`
      DROP INDEX IDX_categories_company_slug ON categories
    `);

    await queryRunner.query(`
      DROP INDEX IDX_categories_company_name ON categories
    `);

    await queryRunner.query('DROP TABLE categories');
  }
}

