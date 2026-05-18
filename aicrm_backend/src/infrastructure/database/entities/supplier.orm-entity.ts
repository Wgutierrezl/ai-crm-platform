import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductOrmEntity } from './product.orm-entity';

@Entity('suppliers')
@Index('IDX_suppliers_company_name', ['companyId', 'name'])
@Index('IDX_suppliers_company_is_active', ['companyId', 'isActive'])
@Index('IDX_suppliers_company_document_number', ['companyId', 'documentNumber'])
export class SupplierOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ name: 'company_id', type: 'varchar', length: 36 })
  companyId: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ name: 'document_type', type: 'varchar', length: 30, nullable: true })
  documentType: string | null;

  @Column({
    name: 'document_number',
    type: 'varchar',
    length: 80,
    nullable: true,
  })
  documentNumber: string | null;

  @Column({ name: 'contact_name', type: 'varchar', length: 160, nullable: true })
  contactName: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => ProductOrmEntity, (product) => product.supplier)
  products?: ProductOrmEntity[];
}
