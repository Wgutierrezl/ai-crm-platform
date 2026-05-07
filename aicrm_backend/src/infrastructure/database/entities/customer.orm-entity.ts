import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('customers')
export class CustomerOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  identificationType: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  identificationNumber: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fullName: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'int', nullable: true })
  age: number | null;

  @Column({ name: 'metadata_json', type: 'json', nullable: true })
  metadataJson: Record<string, unknown> | null;

  @Column({ type: 'boolean', default: false })
  onboardingCompleted: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  onboardingStep: string | null;

  @Column({ type: 'int', default: 0 })
  profileCompletionPercentage: number;

  @Column('varchar', { length: 36 })
  companyId: string;
}
