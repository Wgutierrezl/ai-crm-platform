import { Injectable } from '@nestjs/common';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { Conversation } from '../../domain/entities/conversation.entity';

/**
 * Caso de uso para listar conversaciones por empresa.
 */
@Injectable()
export class GetConversationsUseCase {
  constructor(private readonly conversationRepository: ConversationRepository) {}

  async execute(companyId: string): Promise<Conversation[]> {
    return this.conversationRepository.findAllByCompanyId(companyId);
  }
}
