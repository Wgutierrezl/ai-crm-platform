import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductSupplierRelation1710000000017
  implements MigrationInterface
{
  name = 'AddProductSupplierRelation1710000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      ADD COLUMN supplier_id varchar(36) NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_products_company_supplier
      ON products (companyId, supplier_id)
    `);

    await queryRunner.query(`
      ALTER TABLE products
      ADD CONSTRAINT FK_products_supplier
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE products
      DROP FOREIGN KEY FK_products_supplier
    `);

    await queryRunner.query(`
      DROP INDEX IDX_products_company_supplier ON products
    `);

    await queryRunner.query(`
      ALTER TABLE products
      DROP COLUMN supplier_id
    `);
  }
}

