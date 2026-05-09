import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cart_sessions')
@Index('IDX_cart_sessions_company_customer_channel_status', [
  'companyId',
  'customerId',
  'channel',
  'status',
])
@Index('IDX_cart_sessions_expires_at', ['expiresAt'])
export class CartSessionOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ name: 'company_id', type: 'varchar', length: 36 })
  companyId: string;

  @Column({ name: 'customer_id', type: 'varchar', length: 36 })
  customerId: string;

  @Column({ name: 'conversation_id', type: 'varchar', length: 36, nullable: true })
  conversationId: string | null;

  @Column({ type: 'varchar', length: 30 })
  channel: string;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status: 'active' | 'checked_out' | 'expired' | 'abandoned';

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
