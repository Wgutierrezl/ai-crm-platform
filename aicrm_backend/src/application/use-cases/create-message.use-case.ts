import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { AIService } from '../../domain/ports/ai.service.port';
import { Message, MessageRole } from '../../domain/entities/message.entity';
import { ToolExecutionService } from '../services/tool-execution.service';

export interface CreateMessageInput {
  conversationId: string;
  companyId: string;
  content: string;
  role: MessageRole;
}

export interface ProcessIncomingMessageInput {
  conversationId: string;
  companyId: string;
  customerMessage: string;
  persistCustomerMessage?: boolean;
  outputChannel?: 'api' | 'whatsapp';
  botReplyPrefix?: string;
  assistantContext?: Record<string, unknown>;
}

export interface ProcessIncomingMessageOutput {
  customerMessage: Message;
  botMessage: Message;
  actionExecuted?: string;
}

@Injectable()
export class CreateMessageUseCase {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(input: CreateMessageInput): Promise<Message> {
    const message = new Message(
      uuidv4(),
      input.conversationId,
      input.companyId,
      input.content,
      input.role,
      new Date(),
    );
    return this.messageRepository.create(message);
  }
}

@Injectable()
export class ProcessIncomingMessageUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly aiService: AIService,
    private readonly toolExecutionService: ToolExecutionService,
  ) {}

  async execute(
    input: ProcessIncomingMessageInput,
  ): Promise<ProcessIncomingMessageOutput> {
    let savedCustomerMsg: Message;
    if (input.persistCustomerMessage === false) {
      savedCustomerMsg = new Message(
        uuidv4(),
        input.conversationId,
        input.companyId,
        input.customerMessage,
        'customer',
        new Date(),
        input.outputChannel ?? 'api',
      );
    } else {
      savedCustomerMsg = await this.messageRepository.create(
        new Message(
          uuidv4(),
          input.conversationId,
          input.companyId,
          input.customerMessage,
          'customer',
          new Date(),
          input.outputChannel ?? 'api',
        ),
      );
    }

    const history = await this.messageRepository.findByConversationId(
      input.conversationId,
    );
    const historyForAI = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const aiResponse = await this.aiService.processMessage({
      conversationId: input.conversationId,
      companyId: input.companyId,
      customerMessage: input.customerMessage,
      history: historyForAI,
      assistantContext: input.assistantContext,
    });

    let botReply = `${input.botReplyPrefix ?? ''}${aiResponse.reply}`;
    let actionExecuted: string | undefined;

    if (aiResponse.action) {
      const toolResult = await this.toolExecutionService.execute(
        aiResponse.action.type,
        aiResponse.action.payload,
        { companyId: input.companyId },
      );
      actionExecuted = toolResult.actionExecuted;
      if (toolResult.replySuffix) {
        botReply = `${botReply}${toolResult.replySuffix}`;
      }
    }

    const savedBotMsg = await this.messageRepository.create(
      new Message(
        uuidv4(),
        input.conversationId,
        input.companyId,
        botReply,
        'bot',
        new Date(),
        input.outputChannel ?? 'api',
      ),
    );

    return {
      customerMessage: savedCustomerMsg,
      botMessage: savedBotMsg,
      actionExecuted,
    };
  }
}
