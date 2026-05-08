import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('categories')
@Index('IDX_categories_company_name', ['companyId', 'name'])
@Index('IDX_categories_company_slug', ['companyId', 'slug'])
export class CategoryOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ name: 'company_id', type: 'varchar', length: 36 })
  companyId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true })
  slug: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}

