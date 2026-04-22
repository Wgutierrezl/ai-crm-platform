import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('messages')
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

  @CreateDateColumn()
  createdAt!: Date;
}
