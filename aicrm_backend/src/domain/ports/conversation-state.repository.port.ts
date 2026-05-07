import { ConversationState } from '../entities/conversation-state.entity';

export abstract class ConversationStateRepository {
  abstract create(state: ConversationState): Promise<ConversationState>;
  abstract update(state: ConversationState): Promise<ConversationState>;
  abstract findByConversationId(
    conversationId: string,
  ): Promise<ConversationState | null>;
}
