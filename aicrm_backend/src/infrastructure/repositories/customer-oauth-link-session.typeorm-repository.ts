import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerOauthLinkSession } from '../../domain/entities/customer-oauth-link-session.entity';
import { CustomerOauthLinkSessionRepository } from '../../domain/ports/customer-oauth-link-session.repository.port';
import { CustomerOauthLinkSessionOrmEntity } from '../database/entities/customer-oauth-link-session.orm-entity';

@Injectable()
export class CustomerOauthLinkSessionTypeormRepository
  implements CustomerOauthLinkSessionRepository
{
  constructor(
    @InjectRepository(CustomerOauthLinkSessionOrmEntity)
    private readonly ormRepo: Repository<CustomerOauthLinkSessionOrmEntity>,
  ) {}

  private toDomain(entity: CustomerOauthLinkSessionOrmEntity): CustomerOauthLinkSession {
    return new CustomerOauthLinkSession(
      entity.id,
      entity.companyId,
      entity.customerId,
      entity.conversationId,
      entity.channel,
      entity.externalUserId,
      entity.provider,
      entity.stateToken,
      entity.status as 'pending' | 'consumed',
      entity.expiresAt,
      entity.consumedAt,
      (entity.resultStatus as 'success' | 'cancelled' | 'failed' | 'expired' | null) ??
        null,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(session: CustomerOauthLinkSession): Promise<CustomerOauthLinkSession> {
    const created = this.ormRepo.create({
      id: session.id,
      companyId: session.companyId,
      customerId: session.customerId,
      conversationId: session.conversationId,
      channel: session.channel,
      externalUserId: session.externalUserId,
      provider: session.provider,
      stateToken: session.stateToken,
      status: session.status,
      expiresAt: session.expiresAt,
      consumedAt: session.consumedAt,
      resultStatus: session.resultStatus,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
    const saved = await this.ormRepo.save(created);
    return this.toDomain(saved);
  }

  async findByStateToken(stateToken: string): Promise<CustomerOauthLinkSession | null> {
    const entity = await this.ormRepo.findOneBy({ stateToken });
    return entity ? this.toDomain(entity) : null;
  }

  async update(session: CustomerOauthLinkSession): Promise<CustomerOauthLinkSession> {
    await this.ormRepo.update(
      { id: session.id },
      {
        status: session.status,
        consumedAt: session.consumedAt,
        resultStatus: session.resultStatus,
        updatedAt: session.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({ id: session.id });
    return this.toDomain(updated);
  }
}

