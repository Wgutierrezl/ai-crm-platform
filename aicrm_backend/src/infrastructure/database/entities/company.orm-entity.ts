import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('companies')
export class CompanyOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
