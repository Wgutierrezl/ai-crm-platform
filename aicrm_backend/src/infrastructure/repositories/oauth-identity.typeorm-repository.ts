import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OauthIdentity } from '../../domain/entities/oauth-identity.entity';
import { OauthIdentityRepository } from '../../domain/ports/oauth-identity.repository.port';
import { OauthIdentityOrmEntity } from '../database/entities/oauth-identity.orm-entity';

@Injectable()
export class OauthIdentityTypeormRepository implements OauthIdentityRepository {
  constructor(
    @InjectRepository(OauthIdentityOrmEntity)
    private readonly ormRepo: Repository<OauthIdentityOrmEntity>,
  ) {}

  private toDomain(entity: OauthIdentityOrmEntity): OauthIdentity {
    return new OauthIdentity(
      entity.id,
      entity.provider,
      entity.providerUserId,
      entity.userId,
      entity.email,
      Boolean(entity.emailVerified),
      entity.displayName,
      entity.pictureUrl,
      entity.linkedAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(identity: OauthIdentity): Promise<OauthIdentity> {
    const created = this.ormRepo.create({
      id: identity.id,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      userId: identity.userId,
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

  async findByProviderUserId(
    provider: string,
    providerUserId: string,
  ): Promise<OauthIdentity | null> {
    const entity = await this.ormRepo.findOne({
      where: { provider, providerUserId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByProviderAndUserId(
    provider: string,
    userId: string,
  ): Promise<OauthIdentity | null> {
    const entity = await this.ormRepo.findOne({
      where: { provider, userId },
    });
    return entity ? this.toDomain(entity) : null;
  }
}
