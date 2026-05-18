import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { SupplierOrmEntity } from './supplier.orm-entity';

@Entity('products')
@Index('IDX_products_company_category', ['companyId', 'categoryId'])
@Index('IDX_products_company_supplier', ['companyId', 'supplierId'])
export class ProductOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('decimal', { precision: 12, scale: 2 })
  price: number;

  @Column('int')
  stock: number;

  @Column('varchar', { length: 36 })
  companyId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'varchar', length: 80, nullable: true })
  sku: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  brand: string | null;

  @Column({ name: 'features_json', type: 'json', nullable: true })
  featuresJson: Record<string, unknown> | null;

  @Column({ name: 'tags_json', type: 'json', nullable: true })
  tagsJson: string[] | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'varchar', length: 10, default: 'COP' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  minStock: number;

  @Column({ name: 'metadata_json', type: 'json', nullable: true })
  metadataJson: Record<string, unknown> | null;

  @Column({ name: 'category_id', type: 'varchar', length: 36, nullable: true })
  categoryId: string | null;

  @Column({ name: 'supplier_id', type: 'varchar', length: 36, nullable: true })
  supplierId: string | null;

  @ManyToOne(() => SupplierOrmEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: SupplierOrmEntity | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
