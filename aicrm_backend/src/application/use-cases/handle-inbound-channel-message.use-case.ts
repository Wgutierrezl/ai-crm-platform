import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../../domain/entities/message.entity';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { ProcessIncomingMessageUseCase } from './create-message.use-case';
import {
  AssistantOnboardingToolsService,
  OnboardingStep,
} from '../services/assistant-onboarding-tools.service';
import { WhatsappInteractiveListPayload } from '../../domain/ports/whatsapp-message-sender.port';

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
  interactiveList?: WhatsappInteractiveListPayload | null;
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
          interactiveList: null,
        };
      }
    }

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

    if (resolved.status === 'registered') {
      if (this.onboardingTools.isGreetingMessage(input.text)) {
        const welcome = `Hola ${resolved.customer.firstName ?? resolved.customer.fullName ?? 'de nuevo'} 👋 Qué gusto verte nuevamente.\n\nPuedo ayudarte con:\n- consultar productos,\n- crear pedidos,\n- resolver dudas,\n- revisar tu perfil,\n- y mucho más 😊\n\n¿Qué te gustaría hacer?`;
        await this.persistBot(input.companyId, resolved.conversation.id, input.channel, welcome);
        return {
          shouldReply: true,
          reply: welcome,
          recipientExternalUserId: input.externalUserId,
          interactiveList: null,
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
        interactiveList:
          (aiResult.botMessage.metadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ??
          null,
      };
    }

    const state =
      resolved.state ??
      (await this.onboardingTools.ASSISTANT_START_ONBOARDING({
        companyId: input.companyId,
        conversationId: resolved.conversation.id,
      }));

    const step = resolved.onboardingStep;
    const collected = await this.onboardingTools.ASSISTANT_COLLECT_PROFILE_DATA({
      message: input.text,
      customer: resolved.customer,
      state,
      step,
    });

    const reply = this.buildOnboardingReply({
      currentStep: step,
      nextStep: collected.nextStep,
      validationError: collected.validationError,
      firstName: collected.customer.firstName,
      isNew: !resolved.customerExists,
    });

    await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply);
    return {
      shouldReply: true,
      reply,
      recipientExternalUserId: input.externalUserId,
      interactiveList: null,
    };
  }

  private async persistBot(
    companyId: string,
    conversationId: string,
    channel: 'whatsapp',
    content: string,
  ): Promise<void> {
    await this.messageRepository.create(
      new Message(
        uuidv4(),
        conversationId,
        companyId,
        content,
        'bot',
        new Date(),
        channel,
      ),
    );
  }

  private buildOnboardingReply(input: {
    currentStep: OnboardingStep;
    nextStep: OnboardingStep;
    validationError: string | null;
    firstName: string | null;
    isNew: boolean;
  }): string {
    if (input.validationError === 'name') {
      return 'Para registrarte bien 😊 necesito tu nombre real. Ejemplo: "Walter Gutiérrez".';
    }
    if (input.validationError === 'email') {
      return 'Ese correo no parece válido 🙏 ¿Me lo compartes de nuevo? Ejemplo: nombre@correo.com';
    }
    if (input.validationError === 'document') {
      return 'La cédula no parece válida. Puedes enviarla de nuevo o escribir "omitir" si prefieres saltarla 👌';
    }

    if (input.currentStep === 'WAITING_NAME' && input.nextStep === 'WAITING_EMAIL') {
      return `Excelente ${input.firstName ?? ''} ✨ ¿Me compartes tu correo? Lo usamos para seguimiento y confirmaciones.`.trim();
    }
    if (input.currentStep === 'WAITING_EMAIL' && input.nextStep === 'WAITING_DOCUMENT') {
      return 'Perfecto 👌 ¿Quieres compartirme tu número de cédula? Es opcional y ayuda en validaciones de pedidos.';
    }
    if (input.nextStep === 'COMPLETED') {
      return `¡Listo ${input.firstName ?? ''}! 🎉 Tu registro quedó completo.\n\nAhora puedo ayudarte con:\n- consultar productos,\n- crear pedidos,\n- resolver dudas,\n- revisar tu perfil,\n- y mucho más.\n\n¿Qué te gustaría hacer?`.trim();
    }
    if (input.isNew) {
      return 'Hola 👋 Bienvenido a AI CRM.\n\nSoy tu asistente virtual y puedo ayudarte con productos, pedidos y soporte 😊\n\nAntes de comenzar, ¿cómo te llamas?';
    }
    return 'Continuemos con tu registro 😊 ¿cómo te llamas?';
  }

  private buildAssistantContext(
    resolved: Awaited<
      ReturnType<AssistantOnboardingToolsService['ASSISTANT_RESOLVE_USER_IDENTITY']>
    >,
    channel: string,
  ): Record<string, unknown> {
    return {
      customer_exists: resolved.customerExists,
      customer_name: resolved.customer.firstName ?? resolved.customer.fullName ?? null,
      onboarding_completed: resolved.onboardingCompleted,
      onboarding_step: resolved.onboardingStep,
      missing_fields: resolved.missingFields,
      customer_profile: {
        firstName: resolved.customer.firstName,
        email: resolved.customer.email,
        identificationNumber: resolved.customer.identificationNumber,
      },
      conversation_state: resolved.state?.registrationStep ?? null,
      available_tools: [
        'CRM_GET_CATEGORIES',
        'CRM_SEARCH_CATEGORIES',
        'CRM_GET_PRODUCTS_BY_CATEGORY',
        'CRM_GET_CATEGORY_BY_NAME',
        'CRM_GET_PRODUCTS',
        'CRM_SEARCH_PRODUCTS',
        'CRM_GET_PRODUCT_BY_NAME',
        'CRM_FILTER_PRODUCTS_BY_PRICE',
        'CRM_GET_PRODUCT_STOCK',
        'CRM_SEARCH_PRODUCTS_BY_CATEGORY_OR_TEXT',
        'CRM_GET_PRODUCTS_BY_CATEGORY_AND_PRICE',
      ],
      current_channel: channel,
    };
  }
}
