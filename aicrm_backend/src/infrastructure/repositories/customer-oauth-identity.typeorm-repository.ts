import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerOauthIdentity } from '../../domain/entities/customer-oauth-identity.entity';
import { CustomerOauthIdentityRepository } from '../../domain/ports/customer-oauth-identity.repository.port';
import { CustomerOauthIdentityOrmEntity } from '../database/entities/customer-oauth-identity.orm-entity';

@Injectable()
export class CustomerOauthIdentityTypeormRepository
  implements CustomerOauthIdentityRepository
{
  constructor(
    @InjectRepository(CustomerOauthIdentityOrmEntity)
    private readonly ormRepo: Repository<CustomerOauthIdentityOrmEntity>,
  ) {}

  private toDomain(entity: CustomerOauthIdentityOrmEntity): CustomerOauthIdentity {
    return new CustomerOauthIdentity(
      entity.id,
      entity.companyId,
      entity.customerId,
      entity.provider,
      entity.providerUserId,
      entity.email,
      Boolean(entity.emailVerified),
      entity.displayName,
      entity.pictureUrl,
      entity.linkedAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(identity: CustomerOauthIdentity): Promise<CustomerOauthIdentity> {
    const created = this.ormRepo.create({
      id: identity.id,
      companyId: identity.companyId,
      customerId: identity.customerId,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      email: identity.email,
      emailVerified: identity.emailVerified,
      displayName: identity.displayName,
      pictureUrl: identity.pictureUrl,
      linkedAt: identity.linkedAt,
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt,
    });
    const saved = await this.ormRepo.save(created);
    return this.toDomain(saved);
  }

  async update(identity: CustomerOauthIdentity): Promise<CustomerOauthIdentity> {
    await this.ormRepo.update(
      { id: identity.id },
      {
        email: identity.email,
        emailVerified: identity.emailVerified,
        displayName: identity.displayName,
        pictureUrl: identity.pictureUrl,
        linkedAt: identity.linkedAt,
        updatedAt: identity.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({ id: identity.id });
    return this.toDomain(updated);
  }

  async findByCompanyProviderUserId(
    companyId: string,
    provider: string,
    providerUserId: string,
  ): Promise<CustomerOauthIdentity | null> {
    const entity = await this.ormRepo.findOneBy({
      companyId,
      provider,
      providerUserId,
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompanyProviderCustomerId(
    companyId: string,
    provider: string,
    customerId: string,
  ): Promise<CustomerOauthIdentity | null> {
    const entity = await this.ormRepo.findOneBy({ companyId, provider, customerId });
    return entity ? this.toDomain(entity) : null;
  }
}

