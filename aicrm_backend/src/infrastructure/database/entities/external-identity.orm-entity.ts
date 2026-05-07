import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('external_identities')
@Index('UQ_external_identity_company_channel_external', ['companyId', 'channel', 'externalUserId'], {
  unique: true,
})
export class ExternalIdentityOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ name: 'company_id', type: 'varchar', length: 36 })
  companyId!: string;

  @Column({ type: 'varchar', length: 30 })
  channel!: string;

  @Column({ name: 'external_user_id', type: 'varchar', length: 120 })
  externalUserId!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ name: 'customer_id', type: 'varchar', length: 36, nullable: true })
  customerId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
