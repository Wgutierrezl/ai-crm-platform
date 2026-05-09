import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('companies')
export class CompanyOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'assistant_name', type: 'varchar', length: 100, nullable: true })
  assistantName!: string | null;

  @Column({ name: 'assistant_context', type: 'text', nullable: true })
  assistantContext!: string | null;

  @Column({ name: 'assistant_welcome_message', type: 'text', nullable: true })
  assistantWelcomeMessage!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
