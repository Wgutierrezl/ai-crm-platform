import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('company_whatsapp_apps')
@Index('IDX_company_whatsapp_apps_phone_number_id', ['phoneNumberId'])
export class CompanyWhatsappAppOrmEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ name: 'company_id', type: 'varchar', length: 36, nullable: true })
  companyId: string | null;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({
    name: 'phone_number_id',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  phoneNumberId: string;

  @Column({ name: 'business_account_id', type: 'varchar', length: 255 })
  businessAccountId: string;

  @Column({ name: 'app_id', type: 'varchar', length: 255, nullable: true })
  appId: string | null;

  @Column({
    name: 'display_phone_number',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  displayPhoneNumber: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
