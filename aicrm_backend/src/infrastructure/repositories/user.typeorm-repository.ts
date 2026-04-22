import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../domain/ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../database/entities/user.orm-entity';

@Injectable()
export class UserTypeormRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepo: Repository<UserOrmEntity>,
  ) {}

  private toDomain(entity: UserOrmEntity): User {
    return new User(
      entity.id,
      entity.email,
      entity.passwordHash,
      entity.identificationType,
      entity.identificationNumber,
      entity.role as 'admin' | 'agent',
      entity.companyId,
      entity.createdAt,
      entity.fullName,
    );
  }

  async create(user: User): Promise<User> {
    const entity = this.ormRepo.create({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      identificationType: user.identificationType,
      identificationNumber: user.identificationNumber,
      fullName: user.fullName,
      role: user.role,
      companyId: user.companyId,
      createdAt: user.createdAt,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.ormRepo.findOneBy({ email });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<User[]> {
    const entities = await this.ormRepo.findBy({ companyId });
    return entities.map((e) => this.toDomain(e));
  }
}
