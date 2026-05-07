import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { Conversation } from '../../domain/entities/conversation.entity';
import { ConversationOrmEntity } from '../database/entities/conversation.orm-entity';

@Injectable()
export class ConversationTypeormRepository implements ConversationRepository {
  constructor(
    @InjectRepository(ConversationOrmEntity)
    private readonly ormRepo: Repository<ConversationOrmEntity>,
  ) {}

  private toDomain(e: ConversationOrmEntity): Conversation {
    return new Conversation(e.id, e.customerId, e.companyId, e.createdAt);
  }

  async create(conversation: Conversation): Promise<Conversation> {
    const entity = this.ormRepo.create({
      id: conversation.id,
      customerId: conversation.customerId,
      companyId: conversation.companyId,
      createdAt: conversation.createdAt,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Conversation | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Conversation[]> {
    const entities = await this.ormRepo.findBy({ companyId });
    return entities.map((e) => this.toDomain(e));
  }

  async findLatestByCustomerId(
    customerId: string,
    companyId: string,
  ): Promise<Conversation | null> {
    const entity = await this.ormRepo.findOne({
      where: { customerId, companyId },
      order: { createdAt: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }
}
