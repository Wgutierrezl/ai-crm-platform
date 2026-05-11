import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartSession } from '../../domain/entities/cart-session.entity';
import { CartSessionRepository } from '../../domain/ports/cart-session.repository.port';
import { CartSessionOrmEntity } from '../database/entities/cart-session.orm-entity';

@Injectable()
export class CartSessionTypeormRepository implements CartSessionRepository {
  constructor(
    @InjectRepository(CartSessionOrmEntity)
    private readonly ormRepo: Repository<CartSessionOrmEntity>,
  ) {}

  private toDomain(entity: CartSessionOrmEntity): CartSession {
    return new CartSession(
      entity.id,
      entity.companyId,
      entity.customerId,
      entity.conversationId ?? null,
      entity.channel,
      entity.status,
      entity.expiresAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(session: CartSession): Promise<CartSession> {
    const saved = await this.ormRepo.save(
      this.ormRepo.create({
        id: session.id,
        companyId: session.companyId,
        customerId: session.customerId,
        conversationId: session.conversationId,
        channel: session.channel,
        status: session.status,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }),
    );
    return this.toDomain(saved);
  }

  async update(session: CartSession): Promise<CartSession> {
    await this.ormRepo.update(
      { id: session.id, companyId: session.companyId },
      {
        customerId: session.customerId,
        conversationId: session.conversationId,
        channel: session.channel,
        status: session.status,
        expiresAt: session.expiresAt,
        updatedAt: session.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({
      id: session.id,
      companyId: session.companyId,
    });
    return this.toDomain(updated);
  }

  async findActiveByCustomer(
    companyId: string,
    customerId: string,
    channel: string,
  ): Promise<CartSession | null> {
    const found = await this.ormRepo.findOne({
      where: {
        companyId,
        customerId,
        channel,
        status: 'active',
      },
      order: { updatedAt: 'DESC' },
    });
    return found ? this.toDomain(found) : null;
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<CartSession | null> {
    const found = await this.ormRepo.findOne({ where: { id, companyId } });
    return found ? this.toDomain(found) : null;
  }

  async transitionStatus(input: {
    id: string;
    companyId: string;
    fromStatus: CartSession['status'];
    toStatus: CartSession['status'];
  }): Promise<boolean> {
    const result = await this.ormRepo.update(
      { id: input.id, companyId: input.companyId, status: input.fromStatus },
      {
        status: input.toStatus,
        updatedAt: new Date(),
      },
    );
    return (result.affected ?? 0) > 0;
  }

  async expireOldSessions(referenceDate: Date): Promise<number> {
    const result = await this.ormRepo
      .createQueryBuilder()
      .update(CartSessionOrmEntity)
      .set({
        status: 'expired',
        updatedAt: new Date(),
      })
      .where('status = :status', { status: 'active' })
      .andWhere('expires_at <= :referenceDate', { referenceDate })
      .execute();
    return result.affected ?? 0;
  }
}
