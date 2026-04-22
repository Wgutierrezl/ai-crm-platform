import { Conversation } from '../entities/conversation.entity';

export abstract class ConversationRepository {
  abstract create(conversation: Conversation): Promise<Conversation>;
  abstract findById(id: string): Promise<Conversation | null>;
  abstract findAllByCompanyId(companyId: string): Promise<Conversation[]>;
}
