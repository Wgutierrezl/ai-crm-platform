import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('conversations')
export class ConversationOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  customerId: string;

  @Column('varchar', { length: 36 })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
