import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '../../domain/entities/message.entity';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { ProcessIncomingMessageUseCase } from './create-message.use-case';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import {
  AssistantOnboardingToolsService,
  OnboardingStep,
} from '../services/assistant-onboarding-tools.service';
import { WhatsappInteractiveListPayload } from '../../domain/ports/whatsapp-message-sender.port';
import { ToolExecutionService } from '../services/tool-execution.service';
import { AddItemToCartUseCase } from './add-item-to-cart.use-case';
import { ViewCartUseCase } from './view-cart.use-case';
import { ClearCartUseCase } from './clear-cart.use-case';

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
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly toolExecutionService: ToolExecutionService,
    private readonly addItemToCartUseCase: AddItemToCartUseCase,
    private readonly viewCartUseCase: ViewCartUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
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
      const directSelection = this.parseInteractiveSelection(input);
      if (directSelection?.kind === 'cart_add') {
        const added = await this.addItemToCartUseCase.execute({
          companyId: input.companyId,
          customerId: resolved.customer.id,
          conversationId: resolved.conversation.id,
          channel: input.channel,
          productId: directSelection.productId,
          quantity: directSelection.quantity,
        });
        const reply = `Listo. Agregue "${added.item.productNameSnapshot}" al carrito.\nCantidad actual en carrito: ${added.quantityMerged}.\n\nPuedes escribir "ver carrito" para revisarlo o seguir viendo productos.`;
        await this.persistBot(
          input.companyId,
          resolved.conversation.id,
          input.channel,
          reply,
        );
        return {
          shouldReply: true,
          reply,
          recipientExternalUserId: input.externalUserId,
          interactiveList: null,
        };
      }

      if (directSelection?.kind === 'cart_view') {
        const cart = await this.viewCartUseCase.execute({
          companyId: input.companyId,
          customerId: resolved.customer.id,
          conversationId: resolved.conversation.id,
          channel: input.channel,
        });
        const lines = cart.items.map(
          (item, index) =>
            `${index + 1}. ${item.productNameSnapshot}\nCantidad: ${item.quantity}\nPrecio unidad: ${item.currencySnapshot} ${item.unitPriceSnapshot}`,
        );
        const reply =
          cart.items.length > 0
            ? `Tu carrito actual:\n\n${lines.join('\n\n')}\n\nSubtotal: ${cart.totals.currency} ${cart.totals.subtotal}\n\nPuedes pedirme actualizar cantidades, eliminar un producto o limpiar carrito.`
            : 'Tu carrito esta vacio.\nPuedes agregar productos desde el catalogo.';
        await this.persistBot(
          input.companyId,
          resolved.conversation.id,
          input.channel,
          reply,
        );
        return {
          shouldReply: true,
          reply,
          recipientExternalUserId: input.externalUserId,
          interactiveList: null,
        };
      }

      if (directSelection?.kind === 'cart_clear') {
        await this.clearCartUseCase.execute({
          companyId: input.companyId,
          customerId: resolved.customer.id,
          conversationId: resolved.conversation.id,
          channel: input.channel,
        });
        const reply = 'Listo. Tu carrito quedo vacio.';
        await this.persistBot(
          input.companyId,
          resolved.conversation.id,
          input.channel,
          reply,
        );
        return {
          shouldReply: true,
          reply,
          recipientExternalUserId: input.externalUserId,
          interactiveList: null,
        };
      }

      if (directSelection?.kind === 'product') {
        const detail = await this.buildSelectedProductReply(
          input.companyId,
          directSelection.id,
        );
        await this.persistBot(
          input.companyId,
          resolved.conversation.id,
          input.channel,
          detail.reply,
          detail.botMetadata ?? null,
        );
        return {
          shouldReply: true,
          reply: detail.reply,
          recipientExternalUserId: input.externalUserId,
          interactiveList:
            (detail.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ??
            null,
        };
      }

      if (directSelection?.kind === 'category') {
        const categoryResult = await this.toolExecutionService.execute(
          'CRM_GET_PRODUCTS_BY_CATEGORY',
          { categoryId: directSelection.id, limit: 10 },
          {
            companyId: input.companyId,
            customerId: resolved.customer.id,
            conversationId: resolved.conversation.id,
            channel: input.channel,
          },
        );
        const categoryReply =
          categoryResult.replySuffix?.trim() ??
          'No pude cargar los productos de esa categoria en este momento.';
        await this.persistBot(
          input.companyId,
          resolved.conversation.id,
          input.channel,
          categoryReply,
          categoryResult.botMetadata ?? null,
        );
        return {
          shouldReply: true,
          reply: categoryReply,
          recipientExternalUserId: input.externalUserId,
          interactiveList:
            (categoryResult.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ??
            null,
        };
      }

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
    metadata: Record<string, unknown> | null = null,
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
        null,
        metadata,
      ),
    );
  }

  private parseInteractiveSelection(
    input: HandleInboundChannelMessageInput,
  ):
    | { kind: 'product' | 'category'; id: string }
    | { kind: 'cart_add'; productId: string; quantity: number }
    | { kind: 'cart_view' }
    | { kind: 'cart_clear' }
    | null {
    const metadataId = String(input.metadata?.interactiveReplyId ?? '').trim();
    const normalizedText = String(input.text ?? '').trim().toLowerCase();
    const candidate = metadataId || normalizedText;

    if (candidate.startsWith('product:')) {
      return { kind: 'product', id: candidate.replace('product:', '').trim() };
    }
    if (candidate.startsWith('category:')) {
      return { kind: 'category', id: candidate.replace('category:', '').trim() };
    }
    if (candidate.startsWith('cart_add:')) {
      const [, productId, qtyRaw] = candidate.split(':');
      const quantity = Number(qtyRaw ?? '1');
      return {
        kind: 'cart_add',
        productId: String(productId ?? '').trim(),
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      };
    }
    if (candidate === 'cart_view' || normalizedText === 'ver carrito') {
      return { kind: 'cart_view' };
    }
    if (candidate === 'cart_clear' || normalizedText === 'limpiar carrito') {
      return { kind: 'cart_clear' };
    }
    return null;
  }

  private async buildSelectedProductReply(
    companyId: string,
    productId: string,
  ): Promise<{ reply: string; botMetadata?: Record<string, unknown> }> {
    const product = await this.productRepository.findByIdAndCompanyId(
      productId,
      companyId,
    );
    if (!product || !product.isActive) {
      return {
        reply:
          'Ese producto ya no esta disponible en este momento. Si quieres, te muestro otras opciones activas.',
      };
    }

    let categoryName = 'Sin categoria';
    if (product.categoryId) {
      const category = await this.categoryRepository.findById(
        product.categoryId,
        companyId,
      );
      if (!category || !category.isActive) {
        return {
          reply:
            'Ese producto no esta disponible para catalogo publico en este momento. Te puedo mostrar otras categorias activas.',
        };
      }
      categoryName = category.name;
    }

    const description = product.description ?? 'Sin descripcion disponible';
    const imageLine = product.imageUrl ? `\nImagen: ${product.imageUrl}` : '';
    const reply = [
      `Producto seleccionado: ${product.name}`,
      `Descripcion: ${description}`,
      `Precio: ${product.currency} ${product.price}`,
      `Stock: ${product.stock}`,
      `Categoria: ${categoryName}${imageLine}`,
      '',
      'Que quieres hacer ahora?',
      `Si quieres, puedo agregarlo al carrito ahora mismo.`,
      `Escribe: cart_add:${product.id}:1`,
      'Tambien puedes ver mas productos o cambiar de categoria.',
    ].join('\n');

    return {
      reply,
      botMetadata: {
        whatsapp_interactive_list: {
          header: 'Siguiente paso',
          body: 'Que quieres hacer con este producto?',
          buttonText: 'Opciones',
          sections: [
            {
              title: 'Carrito',
              rows: [
                {
                  id: `cart_add:${product.id}:1`,
                  title: 'Agregar al carrito',
                  description: 'Agregar 1 unidad',
                },
                {
                  id: 'cart_view',
                  title: 'Ver carrito',
                  description: 'Revisar productos agregados',
                },
                {
                  id: 'cart_clear',
                  title: 'Limpiar carrito',
                  description: 'Vaciar carrito actual',
                },
              ],
            },
          ],
        },
      },
    };
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
      customer_id: resolved.customer.id,
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
      conversation_id: resolved.conversation.id,
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
        'CART_GET_ACTIVE_SESSION',
        'CART_ADD_ITEM',
        'CART_VIEW',
        'CART_UPDATE_ITEM_QUANTITY',
        'CART_REMOVE_ITEM',
        'CART_CLEAR',
      ],
      current_channel: channel,
    };
  }
}
