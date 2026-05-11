import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_transactions')
@Index('IDX_payment_transactions_cart_session', ['cartSessionId'])
@Index('UQ_payment_transactions_company_idempotency', ['companyId', 'idempotencyKey'], {
  unique: true,
})
export class PaymentTransactionOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ name: 'company_id', type: 'varchar', length: 36 })
  companyId: string;

  @Column({ name: 'customer_id', type: 'varchar', length: 36 })
  customerId: string;

  @Column({ name: 'cart_session_id', type: 'varchar', length: 36, nullable: true })
  cartSessionId: string | null;

  @Column({ name: 'order_id', type: 'varchar', length: 36, nullable: true })
  orderId: string | null;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 120 })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 30 })
  provider: string;

  @Column({ type: 'varchar', length: 20 })
  status: string;

  @Column('decimal', { precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ name: 'mock_reference', type: 'varchar', length: 64 })
  mockReference: string;

  @Column({ name: 'method_type', type: 'varchar', length: 30, nullable: true })
  methodType: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  last4: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  brand: string | null;

  @Column({ name: 'metadata_json', type: 'json', nullable: true })
  metadataJson: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
