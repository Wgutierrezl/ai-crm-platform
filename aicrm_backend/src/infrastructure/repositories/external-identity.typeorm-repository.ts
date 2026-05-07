import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExternalIdentity } from '../../domain/entities/external-identity.entity';
import { ExternalIdentityRepository } from '../../domain/ports/external-identity.repository.port';
import { ExternalIdentityOrmEntity } from '../database/entities/external-identity.orm-entity';

@Injectable()
export class ExternalIdentityTypeormRepository
  implements ExternalIdentityRepository
{
  constructor(
    @InjectRepository(ExternalIdentityOrmEntity)
    private readonly ormRepo: Repository<ExternalIdentityOrmEntity>,
  ) {}

  private toDomain(entity: ExternalIdentityOrmEntity): ExternalIdentity {
    return new ExternalIdentity(
      entity.id,
      entity.companyId,
      entity.channel as 'whatsapp',
      entity.externalUserId,
      entity.phone ?? null,
      entity.customerId ?? null,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(identity: ExternalIdentity): Promise<ExternalIdentity> {
    const entity = this.ormRepo.create({
      id: identity.id,
      companyId: identity.companyId,
      channel: identity.channel,
      externalUserId: identity.externalUserId,
      phone: identity.phone,
      customerId: identity.customerId,
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async update(identity: ExternalIdentity): Promise<ExternalIdentity> {
    await this.ormRepo.update(
      { id: identity.id },
      {
        companyId: identity.companyId,
        channel: identity.channel,
        externalUserId: identity.externalUserId,
        phone: identity.phone,
        customerId: identity.customerId,
        updatedAt: identity.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({ id: identity.id });
    return this.toDomain(updated);
  }

  async findByChannelAndExternalUserId(
    companyId: string,
    channel: string,
    externalUserId: string,
  ): Promise<ExternalIdentity | null> {
    const entity = await this.ormRepo.findOneBy({
      companyId,
      channel,
      externalUserId,
    });
    return entity ? this.toDomain(entity) : null;
  }
}
