import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CartItemRepository } from '../../domain/ports/cart-item.repository.port';
import { CartItemOrmEntity } from '../database/entities/cart-item.orm-entity';

@Injectable()
export class CartItemTypeormRepository implements CartItemRepository {
  constructor(
    @InjectRepository(CartItemOrmEntity)
    private readonly ormRepo: Repository<CartItemOrmEntity>,
  ) {}

  private toDomain(entity: CartItemOrmEntity): CartItem {
    return new CartItem(
      entity.id,
      entity.cartSessionId,
      entity.productId,
      entity.quantity,
      Number(entity.unitPriceSnapshot),
      entity.productNameSnapshot,
      entity.imageUrlSnapshot ?? null,
      entity.currencySnapshot,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(item: CartItem): Promise<CartItem> {
    const saved = await this.ormRepo.save(
      this.ormRepo.create({
        id: item.id,
        cartSessionId: item.cartSessionId,
        productId: item.productId,
        quantity: item.quantity,
        unitPriceSnapshot: item.unitPriceSnapshot,
        productNameSnapshot: item.productNameSnapshot,
        imageUrlSnapshot: item.imageUrlSnapshot,
        currencySnapshot: item.currencySnapshot,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }),
    );
    return this.toDomain(saved);
  }

  async update(item: CartItem): Promise<CartItem> {
    await this.ormRepo.update(
      { id: item.id, cartSessionId: item.cartSessionId },
      {
        quantity: item.quantity,
        unitPriceSnapshot: item.unitPriceSnapshot,
        productNameSnapshot: item.productNameSnapshot,
        imageUrlSnapshot: item.imageUrlSnapshot,
        currencySnapshot: item.currencySnapshot,
        updatedAt: item.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({
      id: item.id,
      cartSessionId: item.cartSessionId,
    });
    return this.toDomain(updated);
  }

  async remove(id: string): Promise<void> {
    await this.ormRepo.delete({ id });
  }

  async removeByCartSessionId(cartSessionId: string): Promise<void> {
    await this.ormRepo.delete({ cartSessionId });
  }

  async findByCartSessionId(cartSessionId: string): Promise<CartItem[]> {
    const entities = await this.ormRepo.find({
      where: { cartSessionId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByCartSessionIdAndProductId(
    cartSessionId: string,
    productId: string,
  ): Promise<CartItem | null> {
    const entity = await this.ormRepo.findOne({
      where: { cartSessionId, productId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByIdAndCartSessionId(
    id: string,
    cartSessionId: string,
  ): Promise<CartItem | null> {
    const entity = await this.ormRepo.findOne({ where: { id, cartSessionId } });
    return entity ? this.toDomain(entity) : null;
  }
}
