import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaymentTransactions1710000000011
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE payment_transactions (
        id varchar(36) NOT NULL PRIMARY KEY,
        company_id varchar(36) NOT NULL,
        customer_id varchar(36) NOT NULL,
        order_id varchar(36) NULL,
        provider varchar(30) NOT NULL,
        status varchar(20) NOT NULL,
        amount decimal(12,2) NOT NULL,
        currency varchar(10) NOT NULL,
        mock_reference varchar(64) NOT NULL,
        method_type varchar(30) NULL,
        last4 varchar(10) NULL,
        brand varchar(30) NULL,
        metadata_json json NULL,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT FK_payment_transactions_company FOREIGN KEY (company_id) REFERENCES companies(id),
        CONSTRAINT FK_payment_transactions_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
        CONSTRAINT FK_payment_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE payment_transactions');
  }
}
