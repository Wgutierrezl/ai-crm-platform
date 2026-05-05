import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { Conversation } from '../../domain/entities/conversation.entity';

export interface CreateConversationInput {
  customerId: string;
  companyId: string;
}

/**
 * Caso de uso para crear una nueva conversacion entre cliente y empresa.
 */
@Injectable()
export class CreateConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute(input: CreateConversationInput): Promise<Conversation> {
    const conversation = new Conversation(
      uuidv4(),
      input.customerId,
      input.companyId,
      new Date(),
    );
    return this.conversationRepository.create(conversation);
  }
}
