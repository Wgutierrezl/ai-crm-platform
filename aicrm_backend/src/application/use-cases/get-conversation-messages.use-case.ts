import { Injectable, NotFoundException } from '@nestjs/common';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { Message } from '../../domain/entities/message.entity';

@Injectable()
export class GetConversationMessagesUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(conversationId: string, companyId: string): Promise<Message[]> {
    const conversation = await this.conversationRepository.findById(conversationId);

    if (!conversation || conversation.companyId !== companyId) {
      throw new NotFoundException('Conversacion no encontrada');
    }

    const messages = await this.messageRepository.findByConversationId(conversationId);

    return [...messages].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }
}
