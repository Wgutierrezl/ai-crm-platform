import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OauthRegistrationSession } from '../../domain/entities/oauth-registration-session.entity';
import { OauthRegistrationSessionRepository } from '../../domain/ports/oauth-registration-session.repository.port';
import { OauthRegistrationSessionOrmEntity } from '../database/entities/oauth-registration-session.orm-entity';

@Injectable()
export class OauthRegistrationSessionTypeormRepository
  implements OauthRegistrationSessionRepository
{
  constructor(
    @InjectRepository(OauthRegistrationSessionOrmEntity)
    private readonly ormRepo: Repository<OauthRegistrationSessionOrmEntity>,
  ) {}

  private toDomain(entity: OauthRegistrationSessionOrmEntity): OauthRegistrationSession {
    return new OauthRegistrationSession(
      entity.id,
      entity.provider,
      entity.providerUserId,
      entity.email,
      Boolean(entity.emailVerified),
      entity.fullName,
      entity.pictureUrl,
      entity.status as 'pending' | 'consumed',
      entity.expiresAt,
      entity.consumedAt,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(session: OauthRegistrationSession): Promise<OauthRegistrationSession> {
    const created = this.ormRepo.create({
      id: session.id,
      provider: session.provider,
      providerUserId: session.providerUserId,
      email: session.email,
      emailVerified: session.emailVerified,
      fullName: session.fullName,
      pictureUrl: session.pictureUrl,
      status: session.status,
      expiresAt: session.expiresAt,
      consumedAt: session.consumedAt,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
    const saved = await this.ormRepo.save(created);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<OauthRegistrationSession | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async update(session: OauthRegistrationSession): Promise<OauthRegistrationSession> {
    await this.ormRepo.update(
      { id: session.id },
      {
        status: session.status,
        consumedAt: session.consumedAt,
        updatedAt: session.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({ id: session.id });
    return this.toDomain(updated);
  }
}

