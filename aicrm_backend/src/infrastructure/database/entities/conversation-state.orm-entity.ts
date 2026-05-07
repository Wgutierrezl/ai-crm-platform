import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('conversation_states')
@Index('UQ_conversation_states_conversation_id', ['conversationId'], { unique: true })
export class ConversationStateOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'conversation_id', type: 'varchar', length: 36, unique: true })
  conversationId!: string;

  @Column({ name: 'company_id', type: 'varchar', length: 36 })
  companyId!: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @Column({ name: 'registration_step', type: 'varchar', length: 30, default: 'awaiting_name' })
  registrationStep!: string;

  @Column({ name: 'context_json', type: 'json', nullable: true })
  contextJson!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
