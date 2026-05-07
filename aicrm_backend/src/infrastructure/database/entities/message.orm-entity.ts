import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('messages')
@Index('IDX_messages_company_channel_message', [
  'companyId',
  'sourceChannel',
  'channelMessageId',
])
export class MessageOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column('varchar', { length: 36 })
  conversationId!: string;

  @Column('varchar', { length: 36 })
  companyId!: string;

  @Column('text')
  content!: string;

  @Column({ length: 20 })
  role!: string;

  @Column({ name: 'source_channel', type: 'varchar', length: 30, default: 'api' })
  sourceChannel!: string;

  @Column({
    name: 'channel_message_id',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  channelMessageId!: string | null;

  @Column({ name: 'metadata_json', type: 'json', nullable: true })
  metadataJson!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
