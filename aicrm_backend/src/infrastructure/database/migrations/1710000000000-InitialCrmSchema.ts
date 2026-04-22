import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialCrmSchema1710000000000 implements MigrationInterface {
  name = 'InitialCrmSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE companies (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id varchar(36) PRIMARY KEY,
        email varchar(255) NOT NULL UNIQUE,
        passwordHash varchar(255) NOT NULL,
        identificationType varchar(50) NOT NULL,
        identificationNumber varchar(50) NOT NULL,
        fullName varchar(255) NULL,
        role varchar(20) NOT NULL DEFAULT 'agent',
        companyId varchar(36) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_users_company FOREIGN KEY (companyId) REFERENCES companies(id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE customers (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        phone varchar(50) NOT NULL,
        email varchar(255) NOT NULL,
        identificationType varchar(50) NULL,
        identificationNumber varchar(50) NULL,
        companyId varchar(36) NOT NULL,
        CONSTRAINT FK_customers_company FOREIGN KEY (companyId) REFERENCES companies(id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE products (
        id varchar(36) PRIMARY KEY,
        name varchar(255) NOT NULL,
        price decimal(12,2) NOT NULL,
        stock int NOT NULL,
        companyId varchar(36) NOT NULL,
        CONSTRAINT FK_products_company FOREIGN KEY (companyId) REFERENCES companies(id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE conversations (
        id varchar(36) PRIMARY KEY,
        customerId varchar(36) NOT NULL,
        companyId varchar(36) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_conversations_customer FOREIGN KEY (customerId) REFERENCES customers(id),
        CONSTRAINT FK_conversations_company FOREIGN KEY (companyId) REFERENCES companies(id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE messages (
        id varchar(36) PRIMARY KEY,
        conversationId varchar(36) NOT NULL,
        companyId varchar(36) NOT NULL,
        content text NOT NULL,
        role varchar(20) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_messages_conversation FOREIGN KEY (conversationId) REFERENCES conversations(id),
        CONSTRAINT FK_messages_company FOREIGN KEY (companyId) REFERENCES companies(id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE orders (
        id varchar(36) PRIMARY KEY,
        customerId varchar(36) NOT NULL,
        companyId varchar(36) NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'pending',
        total decimal(12,2) NOT NULL,
        createdAt datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT FK_orders_customer FOREIGN KEY (customerId) REFERENCES customers(id),
        CONSTRAINT FK_orders_company FOREIGN KEY (companyId) REFERENCES companies(id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE order_items (
        id varchar(36) PRIMARY KEY,
        orderId varchar(36) NOT NULL,
        productId varchar(36) NOT NULL,
        companyId varchar(36) NOT NULL,
        quantity int NOT NULL,
        price decimal(12,2) NOT NULL,
        CONSTRAINT FK_order_items_order FOREIGN KEY (orderId) REFERENCES orders(id),
        CONSTRAINT FK_order_items_product FOREIGN KEY (productId) REFERENCES products(id),
        CONSTRAINT FK_order_items_company FOREIGN KEY (companyId) REFERENCES companies(id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE order_items');
    await queryRunner.query('DROP TABLE orders');
    await queryRunner.query('DROP TABLE messages');
    await queryRunner.query('DROP TABLE conversations');
    await queryRunner.query('DROP TABLE products');
    await queryRunner.query('DROP TABLE customers');
    await queryRunner.query('DROP TABLE users');
    await queryRunner.query('DROP TABLE companies');
  }
}
