import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCartSessionsAndItems1710000000009
  implements MigrationInterface
{
  name = 'AddCartSessionsAndItems1710000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE cart_sessions (
        id varchar(36) PRIMARY KEY,
        company_id varchar(36) NOT NULL,
        customer_id varchar(36) NOT NULL,
        conversation_id varchar(36) NULL,
        channel varchar(30) NOT NULL,
        status varchar(30) NOT NULL DEFAULT 'active',
        expires_at datetime NOT NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_cart_sessions_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT FK_cart_sessions_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT FK_cart_sessions_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_cart_sessions_company_customer_channel_status
      ON cart_sessions (company_id, customer_id, channel, status)
    `);
    await queryRunner.query(`
      CREATE INDEX IDX_cart_sessions_expires_at
      ON cart_sessions (expires_at)
    `);

    await queryRunner.query(`
      CREATE TABLE cart_items (
        id varchar(36) PRIMARY KEY,
        cart_session_id varchar(36) NOT NULL,
        product_id varchar(36) NOT NULL,
        quantity int NOT NULL,
        unit_price_snapshot decimal(12,2) NOT NULL,
        product_name_snapshot varchar(255) NOT NULL,
        image_url_snapshot varchar(500) NULL,
        currency_snapshot varchar(10) NOT NULL DEFAULT 'COP',
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_cart_items_cart_session FOREIGN KEY (cart_session_id) REFERENCES cart_sessions(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT FK_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_cart_items_cart_session
      ON cart_items (cart_session_id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_cart_items_cart_session_product
      ON cart_items (cart_session_id, product_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX UQ_cart_items_cart_session_product ON cart_items
    `);
    await queryRunner.query(`
      DROP INDEX IDX_cart_items_cart_session ON cart_items
    `);
    await queryRunner.query(`
      DROP TABLE cart_items
    `);

    await queryRunner.query(`
      DROP INDEX IDX_cart_sessions_expires_at ON cart_sessions
    `);
    await queryRunner.query(`
      DROP INDEX IDX_cart_sessions_company_customer_channel_status ON cart_sessions
    `);
    await queryRunner.query(`
      DROP TABLE cart_sessions
    `);
  }
}
