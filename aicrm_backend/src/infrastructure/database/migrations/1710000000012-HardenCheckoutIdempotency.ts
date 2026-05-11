import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenCheckoutIdempotency1710000000012
  implements MigrationInterface
{
  name = 'HardenCheckoutIdempotency1710000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE m1 FROM messages m1
      INNER JOIN messages m2
        ON m1.companyId = m2.companyId
        AND m1.source_channel = m2.source_channel
        AND m1.channel_message_id = m2.channel_message_id
        AND m1.id > m2.id
      WHERE m1.channel_message_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_messages_company_channel_message_notnull
      ON messages (companyId, source_channel, channel_message_id)
    `);

    await queryRunner.query(`
      ALTER TABLE payment_transactions
      ADD COLUMN cart_session_id varchar(36) NULL AFTER customer_id,
      ADD COLUMN idempotency_key varchar(120) NULL AFTER order_id
    `);

    await queryRunner.query(`
      UPDATE payment_transactions
      SET idempotency_key = CONCAT('legacy-', id)
      WHERE idempotency_key IS NULL OR idempotency_key = ''
    `);

    await queryRunner.query(`
      ALTER TABLE payment_transactions
      MODIFY COLUMN idempotency_key varchar(120) NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_payment_transactions_cart_session
      ON payment_transactions (cart_session_id)
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_payment_transactions_company_idempotency
      ON payment_transactions (company_id, idempotency_key)
    `);

    await queryRunner.query(`
      ALTER TABLE payment_transactions
      ADD CONSTRAINT FK_payment_transactions_cart_session
      FOREIGN KEY (cart_session_id) REFERENCES cart_sessions(id)
      ON DELETE SET NULL ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE payment_transactions
      DROP FOREIGN KEY FK_payment_transactions_cart_session
    `);
    await queryRunner.query(`
      DROP INDEX UQ_payment_transactions_company_idempotency ON payment_transactions
    `);
    await queryRunner.query(`
      DROP INDEX IDX_payment_transactions_cart_session ON payment_transactions
    `);
    await queryRunner.query(`
      ALTER TABLE payment_transactions
      DROP COLUMN idempotency_key,
      DROP COLUMN cart_session_id
    `);

    await queryRunner.query(`
      DROP INDEX UQ_messages_company_channel_message_notnull ON messages
    `);
  }
}
