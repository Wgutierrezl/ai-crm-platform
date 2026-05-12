import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('customer_oauth_link_sessions')
@Index('UQ_customer_oauth_link_sessions_state_token', ['stateToken'], {
  unique: true,
})
@Index('IDX_customer_oauth_link_sessions_company_customer_status', [
  'companyId',
  'customerId',
  'status',
])
@Index('IDX_customer_oauth_link_sessions_expires_at', ['expiresAt'])
export class CustomerOauthLinkSessionOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'company_id', type: 'varchar', length: 36 })
  companyId!: string;

  @Column({ name: 'customer_id', type: 'varchar', length: 36 })
  customerId!: string;

  @Column({ name: 'conversation_id', type: 'varchar', length: 36 })
  conversationId!: string;

  @Column({ type: 'varchar', length: 30 })
  channel!: string;

  @Column({ name: 'external_user_id', type: 'varchar', length: 120 })
  externalUserId!: string;

  @Column({ type: 'varchar', length: 30 })
  provider!: string;

  @Column({ name: 'state_token', type: 'varchar', length: 191 })
  stateToken!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @Column({ name: 'consumed_at', type: 'datetime', nullable: true })
  consumedAt!: Date | null;

  @Column({ name: 'result_status', type: 'varchar', length: 30, nullable: true })
  resultStatus!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}

