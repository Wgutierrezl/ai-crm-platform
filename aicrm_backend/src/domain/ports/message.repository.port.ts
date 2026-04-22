import { Message } from '../entities/message.entity';

export abstract class MessageRepository {
  abstract create(message: Message): Promise<Message>;
  abstract findById(id: string): Promise<Message | null>;
  abstract findAllByCompanyId(companyId: string): Promise<Message[]>;
  abstract findByConversationId(conversationId: string): Promise<Message[]>;
}
