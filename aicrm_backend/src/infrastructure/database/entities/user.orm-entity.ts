import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ length: 50 })
  identificationType: string;

  @Column({ length: 50 })
  identificationNumber: string;

  @Column({ length: 255, nullable: true })
  fullName: string;

  @Column({ length: 20, default: 'agent' })
  role: string;

  @Column('varchar', { length: 36 })
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;
}
