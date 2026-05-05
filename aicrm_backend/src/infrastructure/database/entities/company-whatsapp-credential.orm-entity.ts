import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  Index,
  PrimaryColumn,
  ManyToOne,
  UpdateDateColumn,
} from 'typeorm';
import { CompanyWhatsappAppOrmEntity } from './company-whatsapp-app.orm-entity';

@Entity('company_whatsapp_credentials')
@Index('IDX_company_whatsapp_credentials_whatsapp_app_id', ['whatsappAppId'])
export class CompanyWhatsappCredentialOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({
    name: 'whatsapp_app_id',
    type: 'int',
    unsigned: true,
    unique: true,
  })
  whatsappAppId: number;

  @Column('text', { name: 'access_token' })
  accessToken: string;

  @Column({ name: 'verify_token', type: 'varchar', length: 255 })
  verifyToken: string;

  @Column('text', { name: 'app_secret', nullable: true })
  appSecret: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => CompanyWhatsappAppOrmEntity, { nullable: false })
  @JoinColumn({ name: 'whatsapp_app_id' })
  whatsappApp: CompanyWhatsappAppOrmEntity;
}
