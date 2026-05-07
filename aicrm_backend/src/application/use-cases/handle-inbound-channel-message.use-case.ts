import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../../domain/entities/message.entity';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { ProcessIncomingMessageUseCase } from './create-message.use-case';
import { AssistantOnboardingToolsService } from '../services/assistant-onboarding-tools.service';

export interface HandleInboundChannelMessageInput {
  companyId: string;
  channel: 'whatsapp';
  externalUserId: string;
  phone: string | null;
  text: string;
  channelMessageId: string | null;
  metadata?: Record<string, unknown>;
}

export interface HandleInboundChannelMessageOutput {
  shouldReply: boolean;
  reply: string | null;
  recipientExternalUserId: string;
}

@Injectable()
export class HandleInboundChannelMessageUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly processIncomingMessageUseCase: ProcessIncomingMessageUseCase,
    private readonly onboardingTools: AssistantOnboardingToolsService,
  ) {}

  async execute(
    input: HandleInboundChannelMessageInput,
  ): Promise<HandleInboundChannelMessageOutput> {
    if (input.channelMessageId) {
      const existing = await this.messageRepository.findByChannelMessageId(
        input.companyId,
        input.channel,
        input.channelMessageId,
      );
      if (existing) {
        return {
          shouldReply: false,
          reply: null,
          recipientExternalUserId: input.externalUserId,
        };
      }
    }

    // 1) Resolucion obligatoria de identidad antes de cualquier decision.
    const resolved = await this.onboardingTools.ASSISTANT_RESOLVE_USER_IDENTITY({
      companyId: input.companyId,
      channel: input.channel,
      externalUserId: input.externalUserId,
      phone: input.phone,
    });

    await this.messageRepository.create(
      new Message(
        uuidv4(),
        resolved.conversation.id,
        input.companyId,
        input.text,
        'customer',
        new Date(),
        input.channel,
        input.channelMessageId,
        input.metadata ?? null,
      ),
    );

    // 2) Usuario registrado: nunca reinicia onboarding.
    if (resolved.status === 'registered') {
      if (this.onboardingTools.isGreetingMessage(input.text)) {
        const welcome = `Hola ${resolved.customer.firstName ?? resolved.customer.fullName ?? 'de nuevo'} 👋 Qué gusto verte nuevamente.\n\nPuedo ayudarte con:\n- productos,\n- pedidos,\n- soporte,\n- consultas,\n- y mucho más 😊\n\n¿Qué necesitas hoy?`;
        await this.messageRepository.create(
          new Message(
            uuidv4(),
            resolved.conversation.id,
            input.companyId,
            welcome,
            'bot',
            new Date(),
            input.channel,
          ),
        );
        return {
          shouldReply: true,
          reply: welcome,
          recipientExternalUserId: input.externalUserId,
        };
      }

      const aiResult = await this.processIncomingMessageUseCase.execute({
        conversationId: resolved.conversation.id,
        companyId: input.companyId,
        customerMessage: input.text,
        persistCustomerMessage: false,
        outputChannel: input.channel,
        botReplyPrefix: `Hola ${resolved.customer.firstName ?? resolved.customer.fullName ?? 'de nuevo'} 👋 `,
        assistantContext: this.buildAssistantContext(resolved, input.channel),
      });

      return {
        shouldReply: true,
        reply: aiResult.botMessage.content,
        recipientExternalUserId: input.externalUserId,
      };
    }

    // 3) Nuevo o incompleto: continuar onboarding desde estado actual.
    const state =
      resolved.state ??
      (await this.onboardingTools.ASSISTANT_START_ONBOARDING({
        companyId: input.companyId,
        conversationId: resolved.conversation.id,
      }));

    const collection = await this.onboardingTools.ASSISTANT_COLLECT_PROFILE_DATA({
      message: input.text,
      customer: resolved.customer,
      state,
    });

    const nextQuestion = this.buildOnboardingReply({
      customerExists: resolved.customerExists,
      firstName: collection.customer.firstName,
      nextField: collection.nextField,
      completion: collection.completion,
      greeting: this.onboardingTools.isGreetingMessage(input.text),
    });

    if (!collection.nextField) {
      await this.onboardingTools.ASSISTANT_REGISTER_USER({
        customer: collection.customer,
        state: collection.state,
      });
    }

    await this.messageRepository.create(
      new Message(
        uuidv4(),
        resolved.conversation.id,
        input.companyId,
        nextQuestion,
        'bot',
        new Date(),
        input.channel,
        null,
        { flow: 'onboarding', completion: collection.completion },
      ),
    );

    return {
      shouldReply: true,
      reply: nextQuestion,
      recipientExternalUserId: input.externalUserId,
    };
  }

  private buildAssistantContext(
    resolved: Awaited<
      ReturnType<AssistantOnboardingToolsService['ASSISTANT_RESOLVE_USER_IDENTITY']>
    >,
    channel: string,
  ): Record<string, unknown> {
    return {
      customer_exists: resolved.customerExists,
      customer_name:
        resolved.customer.firstName ?? resolved.customer.fullName ?? null,
      onboarding_completed: resolved.onboardingCompleted,
      onboarding_step: resolved.onboardingStep,
      missing_fields: resolved.missingFields,
      customer_profile: {
        firstName: resolved.customer.firstName,
        lastName: resolved.customer.lastName,
        email: resolved.customer.email,
        city: resolved.customer.city,
        address: resolved.customer.address,
        profileCompletionPercentage:
          resolved.customer.profileCompletionPercentage,
      },
      conversation_state: resolved.state?.registrationStep ?? null,
      available_tools: ['GET_PRODUCTS', 'CREATE_CUSTOMER', 'CREATE_ORDER'],
      current_channel: channel,
    };
  }

  private buildOnboardingReply(input: {
    customerExists: boolean;
    firstName: string | null;
    nextField: string | null;
    completion: number;
    greeting: boolean;
  }): string {
    const name = input.firstName ? ` ${input.firstName}` : '';
    if (!input.nextField) {
      return `Perfecto${name} 🙌 Ya quedó listo tu perfil (${input.completion}%). Ahora sí, puedo ayudarte con productos, pedidos, soporte y más 😊 ¿Qué necesitas hoy?`;
    }

    if (!input.customerExists || (input.greeting && input.nextField === 'firstName')) {
      return 'Hola 👋 Bienvenido a AI CRM.\n\nSoy tu asistente virtual y puedo ayudarte con productos, pedidos y soporte 😊\n\nAntes de comenzar, ¿cómo te llamas?';
    }

    const prompts: Record<string, string> = {
      firstName:
        'Antes de continuar, ¿cómo te llamas? Así puedo atenderte de forma más personalizada 😊',
      lastName: `Perfecto${name} 👋 Para completar tu perfil, ¿me compartes tu apellido?`,
      email:
        'Excelente ✨ ¿Me compartes tu correo? Lo usamos para seguimiento y confirmaciones.',
      identificationNumber:
        '¿Quieres compartirme tu número de cédula? (Opcional, ayuda en validaciones de pedidos)',
      city:
        '¿En qué ciudad te encuentras? Así te doy respuestas más relevantes para tu zona.',
      address:
        'Si quieres, también puedo guardar tu dirección para agilizar futuras gestiones 🙌',
    };
    return prompts[input.nextField] ?? 'Cuéntame un poco más y seguimos 😊';
  }
}
