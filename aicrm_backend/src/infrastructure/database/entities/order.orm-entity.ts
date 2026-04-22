import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('orders')
export class OrderOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  customerId: string;

  @Column('varchar', { length: 36 })
  companyId: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column('decimal', { precision: 12, scale: 2 })
  total: number;

  @CreateDateColumn()
  createdAt: Date;
}
