import { Injectable } from '@nestjs/common';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { Conversation } from '../../domain/entities/conversation.entity';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { MessageRepository } from '../../domain/ports/message.repository.port';

export interface ConversationListCustomerView {
  id: string;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
}

export interface ConversationListMessageView {
  id: string;
  content: string;
  role: string;
  sourceChannel: string;
  createdAt: Date;
}

export interface ConversationListView {
  id: string;
  customerId: string;
  companyId: string;
  customer: ConversationListCustomerView | null;
  lastMessage: ConversationListMessageView | null;
  messageCount: number;
  createdAt: Date;
}

/**
 * Caso de uso para listar conversaciones por empresa.
 */
@Injectable()
export class GetConversationsUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(companyId: string): Promise<ConversationListView[]> {
    const conversations = await this.conversationRepository.findAllByCompanyId(
      companyId,
    );

    const sorted = [...conversations].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    return Promise.all(sorted.map((conversation) => this.toListView(conversation)));
  }

  private async toListView(
    conversation: Conversation,
  ): Promise<ConversationListView> {
    const [customer, messages] = await Promise.all([
      this.customerRepository.findById(conversation.customerId),
      this.messageRepository.findByConversationId(conversation.id),
    ]);

    const sameTenantCustomer =
      customer && customer.companyId === conversation.companyId ? customer : null;

    const lastMessage =
      messages.length > 0
        ? messages[messages.length - 1]
        : null;

    return {
      id: conversation.id,
      customerId: conversation.customerId,
      companyId: conversation.companyId,
      customer: sameTenantCustomer
        ? {
            id: sameTenantCustomer.id,
            fullName: sameTenantCustomer.fullName,
            firstName: sameTenantCustomer.firstName,
            lastName: sameTenantCustomer.lastName,
            name: sameTenantCustomer.name,
            phone: sameTenantCustomer.phone,
            email: sameTenantCustomer.email,
          }
        : null,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            role: lastMessage.role,
            sourceChannel: lastMessage.sourceChannel,
            createdAt: lastMessage.createdAt,
          }
        : null,
      messageCount: messages.length,
      createdAt: conversation.createdAt,
    };
  }
}
