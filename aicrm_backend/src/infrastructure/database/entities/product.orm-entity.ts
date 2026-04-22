import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('products')
export class ProductOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column('decimal', { precision: 12, scale: 2 })
  price: number;

  @Column('int')
  stock: number;

  @Column('varchar', { length: 36 })
  companyId: string;
}
