import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationState } from '../../domain/entities/conversation-state.entity';
import { ConversationStateRepository } from '../../domain/ports/conversation-state.repository.port';
import { ConversationStateOrmEntity } from '../database/entities/conversation-state.orm-entity';

@Injectable()
export class ConversationStateTypeormRepository
  implements ConversationStateRepository
{
  constructor(
    @InjectRepository(ConversationStateOrmEntity)
    private readonly ormRepo: Repository<ConversationStateOrmEntity>,
  ) {}

  private toDomain(entity: ConversationStateOrmEntity): ConversationState {
    return new ConversationState(
      entity.id,
      entity.conversationId,
      entity.companyId,
      entity.status as 'active' | 'closed',
      entity.registrationStep as
        | 'WAITING_NAME'
        | 'WAITING_EMAIL'
        | 'WAITING_DOCUMENT'
        | 'COMPLETED'
        | `awaiting_${string}`
        | 'completed',
      entity.contextJson ?? null,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(state: ConversationState): Promise<ConversationState> {
    const entity = this.ormRepo.create({
      id: state.id,
      conversationId: state.conversationId,
      companyId: state.companyId,
      status: state.status,
      registrationStep: state.registrationStep,
      contextJson: state.context,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async update(state: ConversationState): Promise<ConversationState> {
    await this.ormRepo.update(
      { id: state.id },
      {
        status: state.status,
        registrationStep: state.registrationStep,
        contextJson: state.context as any,
        updatedAt: state.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({ id: state.id });
    return this.toDomain(updated);
  }

  async findByConversationId(
    conversationId: string,
  ): Promise<ConversationState | null> {
    const entity = await this.ormRepo.findOneBy({ conversationId });
    return entity ? this.toDomain(entity) : null;
  }
}
