import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderRepository } from '../../domain/ports/order.repository.port';
import { Order, OrderStatus } from '../../domain/entities/order.entity';
import { OrderOrmEntity } from '../database/entities/order.orm-entity';

@Injectable()
export class OrderTypeormRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly ormRepo: Repository<OrderOrmEntity>,
  ) {}

  private toDomain(e: OrderOrmEntity): Order {
    return new Order(
      e.id,
      e.customerId,
      e.companyId,
      e.status as OrderStatus,
      Number(e.total),
      e.createdAt,
    );
  }

  async create(order: Order): Promise<Order> {
    const entity = this.ormRepo.create({
      id: order.id,
      customerId: order.customerId,
      companyId: order.companyId,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Order | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Order[]> {
    const entities = await this.ormRepo.findBy({ companyId });
    return entities.map((e) => this.toDomain(e));
  }
}
