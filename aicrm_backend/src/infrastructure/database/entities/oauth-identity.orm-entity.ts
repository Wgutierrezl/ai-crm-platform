import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('oauth_identities')
@Index('UQ_oauth_identities_provider_user', ['provider', 'providerUserId'], {
  unique: true,
})
@Index('UQ_oauth_identities_provider_user_id', ['provider', 'userId'], {
  unique: true,
})
export class OauthIdentityOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id!: string;

  @Column({ type: 'varchar', length: 30 })
  provider!: string;

  @Column({ name: 'provider_user_id', type: 'varchar', length: 191 })
  providerUserId!: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ name: 'email_verified', type: 'tinyint', width: 1, default: 0 })
  emailVerified!: boolean;

  @Column({ name: 'display_name', type: 'varchar', length: 255, nullable: true })
  displayName!: string | null;

  @Column({ name: 'picture_url', type: 'varchar', length: 500, nullable: true })
  pictureUrl!: string | null;

  @Column({ name: 'linked_at', type: 'datetime' })
  linkedAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
