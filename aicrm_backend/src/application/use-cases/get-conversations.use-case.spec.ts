import { Conversation } from '../../domain/entities/conversation.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Message } from '../../domain/entities/message.entity';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { GetConversationsUseCase } from './get-conversations.use-case';

class ConversationRepositoryStub extends ConversationRepository {
  conversations: Conversation[] = [];

  async create(conversation: Conversation): Promise<Conversation> {
    return conversation;
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.conversations.find((conversation) => conversation.id === id) ?? null;
  }

  async findAllByCompanyId(companyId: string): Promise<Conversation[]> {
    return this.conversations.filter((conversation) => conversation.companyId === companyId);
  }

  async findLatestByCustomerId(
    customerId: string,
    companyId: string,
  ): Promise<Conversation | null> {
    return (
      this.conversations
        .filter(
          (conversation) =>
            conversation.customerId === customerId && conversation.companyId === companyId,
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null
    );
  }
}

class CustomerRepositoryStub extends CustomerRepository {
  customers: Customer[] = [];

  async create(customer: Customer): Promise<Customer> {
    return customer;
  }

  async update(customer: Customer): Promise<Customer> {
    return customer;
  }

  async findById(id: string): Promise<Customer | null> {
    return this.customers.find((customer) => customer.id === id) ?? null;
  }

  async findByPhone(): Promise<Customer | null> {
    return null;
  }

  async findAllByCompanyId(): Promise<Customer[]> {
    return [];
  }
}

class MessageRepositoryStub extends MessageRepository {
  messagesByConversation: Record<string, Message[]> = {};

  async create(message: Message): Promise<Message> {
    return message;
  }

  async findById(): Promise<Message | null> {
    return null;
  }

  async findAllByCompanyId(): Promise<Message[]> {
    return [];
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    return this.messagesByConversation[conversationId] ?? [];
  }

  async findByChannelMessageId(): Promise<Message | null> {
    return null;
  }
}

describe('GetConversationsUseCase', () => {
  let conversationRepository: ConversationRepositoryStub;
  let customerRepository: CustomerRepositoryStub;
  let messageRepository: MessageRepositoryStub;
  let useCase: GetConversationsUseCase;

  beforeEach(() => {
    conversationRepository = new ConversationRepositoryStub();
    customerRepository = new CustomerRepositoryStub();
    messageRepository = new MessageRepositoryStub();
    useCase = new GetConversationsUseCase(
      conversationRepository,
      customerRepository,
      messageRepository,
    );
  });

  it('returns enriched conversation with customer and last message', async () => {
    conversationRepository.conversations = [
      new Conversation('conv-1', 'cust-1', 'company-1', new Date('2026-01-01T10:00:00.000Z')),
    ];

    customerRepository.customers = [
      new Customer(
        'cust-1',
        'Nombre Base',
        '+573001112233',
        'cliente@demo.com',
        'company-1',
        null,
        null,
        'Laura',
        'Perez',
        'Laura Perez',
      ),
    ];

    messageRepository.messagesByConversation['conv-1'] = [
      new Message('msg-1', 'conv-1', 'company-1', 'Hola', 'customer', new Date('2026-01-01T10:01:00.000Z')),
      new Message('msg-2', 'conv-1', 'company-1', 'Te ayudo', 'agent', new Date('2026-01-01T10:02:00.000Z')),
    ];

    const result = await useCase.execute('company-1');

    expect(result).toHaveLength(1);
    expect(result[0].customer?.fullName).toBe('Laura Perez');
    expect(result[0].messageCount).toBe(2);
    expect(result[0].lastMessage?.id).toBe('msg-2');
    expect(result[0].lastMessage?.content).toBe('Te ayudo');
  });

  it('does not mix tenants and returns customer null when customer does not belong to conversation tenant', async () => {
    conversationRepository.conversations = [
      new Conversation('conv-1', 'cust-1', 'company-1', new Date('2026-01-01T10:00:00.000Z')),
      new Conversation('conv-2', 'cust-2', 'company-2', new Date('2026-01-01T11:00:00.000Z')),
    ];

    customerRepository.customers = [
      new Customer('cust-1', 'A', null, null, 'company-2'),
      new Customer('cust-2', 'B', null, null, 'company-2'),
    ];

    const result = await useCase.execute('company-1');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('conv-1');
    expect(result[0].customer).toBeNull();
  });

  it('returns lastMessage null when conversation has no messages', async () => {
    conversationRepository.conversations = [
      new Conversation('conv-1', 'cust-1', 'company-1', new Date('2026-01-01T10:00:00.000Z')),
    ];

    customerRepository.customers = [
      new Customer('cust-1', 'Cliente sin mensajes', null, null, 'company-1'),
    ];

    messageRepository.messagesByConversation['conv-1'] = [];

    const result = await useCase.execute('company-1');

    expect(result).toHaveLength(1);
    expect(result[0].messageCount).toBe(0);
    expect(result[0].lastMessage).toBeNull();
  });
});
