import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSuppliers1710000000016 implements MigrationInterface {
  name = 'AddSuppliers1710000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE suppliers (
        id varchar(36) NOT NULL PRIMARY KEY,
        company_id varchar(36) NOT NULL,
        name varchar(160) NOT NULL,
        document_type varchar(30) NULL,
        document_number varchar(80) NULL,
        contact_name varchar(160) NULL,
        phone varchar(40) NULL,
        email varchar(255) NULL,
        address varchar(255) NULL,
        city varchar(120) NULL,
        notes text NULL,
        is_active tinyint NOT NULL DEFAULT 1,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_suppliers_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_suppliers_company_name
      ON suppliers (company_id, name)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_suppliers_company_is_active
      ON suppliers (company_id, is_active)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_suppliers_company_document_number
      ON suppliers (company_id, document_number)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IDX_suppliers_company_document_number ON suppliers
    `);
    await queryRunner.query(`
      DROP INDEX IDX_suppliers_company_is_active ON suppliers
    `);
    await queryRunner.query(`
      DROP INDEX IDX_suppliers_company_name ON suppliers
    `);
    await queryRunner.query(`
      DROP TABLE suppliers
    `);
  }
}

