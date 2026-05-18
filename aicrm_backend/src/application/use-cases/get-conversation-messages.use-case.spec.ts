import { NotFoundException } from '@nestjs/common';
import { Conversation } from '../../domain/entities/conversation.entity';
import { Message } from '../../domain/entities/message.entity';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { GetConversationMessagesUseCase } from './get-conversation-messages.use-case';

class ConversationRepositoryStub extends ConversationRepository {
  conversation: Conversation | null = null;

  async create(conversation: Conversation): Promise<Conversation> {
    return conversation;
  }

  async findById(): Promise<Conversation | null> {
    return this.conversation;
  }

  async findAllByCompanyId(): Promise<Conversation[]> {
    return [];
  }

  async findLatestByCustomerId(): Promise<Conversation | null> {
    return null;
  }
}

class MessageRepositoryStub extends MessageRepository {
  messages: Message[] = [];

  async create(message: Message): Promise<Message> {
    return message;
  }

  async findById(): Promise<Message | null> {
    return null;
  }

  async findAllByCompanyId(): Promise<Message[]> {
    return [];
  }

  async findByConversationId(): Promise<Message[]> {
    return this.messages;
  }

  async findByChannelMessageId(): Promise<Message | null> {
    return null;
  }
}

describe('GetConversationMessagesUseCase', () => {
  let conversationRepo: ConversationRepositoryStub;
  let messageRepo: MessageRepositoryStub;
  let useCase: GetConversationMessagesUseCase;

  beforeEach(() => {
    conversationRepo = new ConversationRepositoryStub();
    messageRepo = new MessageRepositoryStub();
    useCase = new GetConversationMessagesUseCase(conversationRepo, messageRepo);
  });

  it('returns messages for same tenant conversation', async () => {
    conversationRepo.conversation = new Conversation(
      'conv-1',
      'cust-1',
      'company-1',
      new Date('2026-01-01T10:00:00.000Z'),
    );

    messageRepo.messages = [
      new Message('m2', 'conv-1', 'company-1', 'segundo', 'agent', new Date('2026-01-01T10:02:00.000Z')),
      new Message('m1', 'conv-1', 'company-1', 'primero', 'customer', new Date('2026-01-01T10:01:00.000Z')),
    ];

    const result = await useCase.execute('conv-1', 'company-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('m1');
    expect(result[1].id).toBe('m2');
  });

  it('rejects access to conversation from another tenant', async () => {
    conversationRepo.conversation = new Conversation(
      'conv-1',
      'cust-1',
      'company-2',
      new Date('2026-01-01T10:00:00.000Z'),
    );

    await expect(useCase.execute('conv-1', 'company-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns empty array when conversation has no messages', async () => {
    conversationRepo.conversation = new Conversation(
      'conv-1',
      'cust-1',
      'company-1',
      new Date('2026-01-01T10:00:00.000Z'),
    );

    messageRepo.messages = [];

    const result = await useCase.execute('conv-1', 'company-1');

    expect(result).toEqual([]);
  });

  it('rejects when conversation does not exist', async () => {
    conversationRepo.conversation = null;

    await expect(useCase.execute('missing', 'company-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
