import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItemRepository } from '../../domain/ports/order-item.repository.port';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { OrderItemOrmEntity } from '../database/entities/order-item.orm-entity';

@Injectable()
export class OrderItemTypeormRepository implements OrderItemRepository {
  constructor(
    @InjectRepository(OrderItemOrmEntity)
    private readonly ormRepo: Repository<OrderItemOrmEntity>,
  ) {}

  private toDomain(e: OrderItemOrmEntity): OrderItem {
    return new OrderItem(
      e.id,
      e.orderId,
      e.productId,
      e.companyId,
      e.quantity,
      Number(e.price),
    );
  }

  async create(orderItem: OrderItem): Promise<OrderItem> {
    const entity = this.ormRepo.create({
      id: orderItem.id,
      orderId: orderItem.orderId,
      productId: orderItem.productId,
      companyId: orderItem.companyId,
      quantity: orderItem.quantity,
      price: orderItem.price,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<OrderItem | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<OrderItem[]> {
    const entities = await this.ormRepo.findBy({ companyId });
    return entities.map((e) => this.toDomain(e));
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const entities = await this.ormRepo.findBy({ orderId });
    return entities.map((e) => this.toDomain(e));
  }
}
