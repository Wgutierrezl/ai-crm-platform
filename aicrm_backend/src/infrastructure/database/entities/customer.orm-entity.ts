import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('customers')
export class CustomerOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50 })
  phone: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 50, nullable: true })
  identificationType: string;

  @Column({ length: 50, nullable: true })
  identificationNumber: string;

  @Column('varchar', { length: 36 })
  companyId: string;
}
