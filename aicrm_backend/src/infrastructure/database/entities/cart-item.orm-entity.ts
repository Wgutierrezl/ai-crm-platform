import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cart_items')
@Index('IDX_cart_items_cart_session', ['cartSessionId'])
@Index('UQ_cart_items_cart_session_product', ['cartSessionId', 'productId'], {
  unique: true,
})
export class CartItemOrmEntity {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ name: 'cart_session_id', type: 'varchar', length: 36 })
  cartSessionId: string;

  @Column({ name: 'product_id', type: 'varchar', length: 36 })
  productId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'unit_price_snapshot', type: 'decimal', precision: 12, scale: 2 })
  unitPriceSnapshot: number;

  @Column({ name: 'product_name_snapshot', type: 'varchar', length: 255 })
  productNameSnapshot: string;

  @Column({ name: 'image_url_snapshot', type: 'varchar', length: 500, nullable: true })
  imageUrlSnapshot: string | null;

  @Column({ name: 'currency_snapshot', type: 'varchar', length: 10, default: 'COP' })
  currencySnapshot: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
