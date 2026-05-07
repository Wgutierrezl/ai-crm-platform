import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { Message, MessageRole } from '../../domain/entities/message.entity';
import { MessageOrmEntity } from '../database/entities/message.orm-entity';

@Injectable()
export class MessageTypeormRepository implements MessageRepository {
  constructor(
    @InjectRepository(MessageOrmEntity)
    private readonly ormRepo: Repository<MessageOrmEntity>,
  ) {}

  private toDomain(e: MessageOrmEntity): Message {
    return new Message(
      e.id,
      e.conversationId,
      e.companyId,
      e.content,
      e.role as MessageRole,
      e.createdAt,
      (e.sourceChannel as 'api' | 'whatsapp') ?? 'api',
      e.channelMessageId ?? null,
      e.metadataJson ?? null,
    );
  }

  async create(message: Message): Promise<Message> {
    const entity = this.ormRepo.create({
      id: message.id,
      conversationId: message.conversationId,
      companyId: message.companyId,
      content: message.content,
      role: message.role,
      createdAt: message.createdAt,
      sourceChannel: message.sourceChannel,
      channelMessageId: message.channelMessageId,
      metadataJson: message.metadata,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Message | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Message[]> {
    const entities = await this.ormRepo.findBy({ companyId });
    return entities.map((e) => this.toDomain(e));
  }

  async findByConversationId(conversationId: string): Promise<Message[]> {
    const entities = await this.ormRepo.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findByChannelMessageId(
    companyId: string,
    sourceChannel: string,
    channelMessageId: string,
  ): Promise<Message | null> {
    const entity = await this.ormRepo.findOne({
      where: { companyId, sourceChannel, channelMessageId },
    });
    return entity ? this.toDomain(entity) : null;
  }
}
