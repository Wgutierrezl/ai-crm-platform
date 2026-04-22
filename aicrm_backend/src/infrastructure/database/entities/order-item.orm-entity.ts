import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('order_items')
export class OrderItemOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  orderId: string;

  @Column('varchar', { length: 36 })
  productId: string;

  @Column('varchar', { length: 36 })
  companyId: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 12, scale: 2 })
  price: number;
}
