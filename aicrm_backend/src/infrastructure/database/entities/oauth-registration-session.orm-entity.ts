import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('oauth_registration_sessions')
@Index('UQ_oauth_reg_sessions_provider_user', ['provider', 'providerUserId', 'status'])
@Index('IDX_oauth_reg_sessions_expires_at', ['expiresAt'])
export class OauthRegistrationSessionOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 30 })
  provider!: string;

  @Column({ name: 'provider_user_id', type: 'varchar', length: 191 })
  providerUserId!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ name: 'email_verified', type: 'tinyint', width: 1, default: 0 })
  emailVerified!: boolean;

  @Column({ name: 'full_name', type: 'varchar', length: 255, nullable: true })
  fullName!: string | null;

  @Column({ name: 'picture_url', type: 'varchar', length: 500, nullable: true })
  pictureUrl!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @Column({ name: 'consumed_at', type: 'datetime', nullable: true })
  consumedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}

