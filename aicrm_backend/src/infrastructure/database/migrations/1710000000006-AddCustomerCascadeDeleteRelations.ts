import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerCascadeDeleteRelations1710000000006
  implements MigrationInterface
{
  name = 'AddCustomerCascadeDeleteRelations1710000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // conversations -> customers
    await queryRunner.query(`
      ALTER TABLE conversations
      DROP FOREIGN KEY FK_conversations_customer
    `);
    await queryRunner.query(`
      ALTER TABLE conversations
      ADD CONSTRAINT FK_conversations_customer
      FOREIGN KEY (customerId) REFERENCES customers(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // messages -> conversations
    await queryRunner.query(`
      ALTER TABLE messages
      DROP FOREIGN KEY FK_messages_conversation
    `);
    await queryRunner.query(`
      ALTER TABLE messages
      ADD CONSTRAINT FK_messages_conversation
      FOREIGN KEY (conversationId) REFERENCES conversations(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // conversation_states -> conversations
    await queryRunner.query(`
      ALTER TABLE conversation_states
      DROP FOREIGN KEY FK_conversation_states_conversation
    `);
    await queryRunner.query(`
      ALTER TABLE conversation_states
      ADD CONSTRAINT FK_conversation_states_conversation
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // external_identities -> customers
    await queryRunner.query(`
      ALTER TABLE external_identities
      DROP FOREIGN KEY FK_external_identities_customer
    `);
    await queryRunner.query(`
      ALTER TABLE external_identities
      ADD CONSTRAINT FK_external_identities_customer
      FOREIGN KEY (customer_id) REFERENCES customers(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // orders -> customers
    await queryRunner.query(`
      ALTER TABLE orders
      DROP FOREIGN KEY FK_orders_customer
    `);
    await queryRunner.query(`
      ALTER TABLE orders
      ADD CONSTRAINT FK_orders_customer
      FOREIGN KEY (customerId) REFERENCES customers(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);

    // order_items -> orders
    await queryRunner.query(`
      ALTER TABLE order_items
      DROP FOREIGN KEY FK_order_items_order
    `);
    await queryRunner.query(`
      ALTER TABLE order_items
      ADD CONSTRAINT FK_order_items_order
      FOREIGN KEY (orderId) REFERENCES orders(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE order_items
      DROP FOREIGN KEY FK_order_items_order
    `);
    await queryRunner.query(`
      ALTER TABLE order_items
      ADD CONSTRAINT FK_order_items_order
      FOREIGN KEY (orderId) REFERENCES orders(id)
    `);

    await queryRunner.query(`
      ALTER TABLE orders
      DROP FOREIGN KEY FK_orders_customer
    `);
    await queryRunner.query(`
      ALTER TABLE orders
      ADD CONSTRAINT FK_orders_customer
      FOREIGN KEY (customerId) REFERENCES customers(id)
    `);

    await queryRunner.query(`
      ALTER TABLE external_identities
      DROP FOREIGN KEY FK_external_identities_customer
    `);
    await queryRunner.query(`
      ALTER TABLE external_identities
      ADD CONSTRAINT FK_external_identities_customer
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    `);

    await queryRunner.query(`
      ALTER TABLE conversation_states
      DROP FOREIGN KEY FK_conversation_states_conversation
    `);
    await queryRunner.query(`
      ALTER TABLE conversation_states
      ADD CONSTRAINT FK_conversation_states_conversation
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    `);

    await queryRunner.query(`
      ALTER TABLE messages
      DROP FOREIGN KEY FK_messages_conversation
    `);
    await queryRunner.query(`
      ALTER TABLE messages
      ADD CONSTRAINT FK_messages_conversation
      FOREIGN KEY (conversationId) REFERENCES conversations(id)
    `);

    await queryRunner.query(`
      ALTER TABLE conversations
      DROP FOREIGN KEY FK_conversations_customer
    `);
    await queryRunner.query(`
      ALTER TABLE conversations
      ADD CONSTRAINT FK_conversations_customer
      FOREIGN KEY (customerId) REFERENCES customers(id)
    `);
  }
}
