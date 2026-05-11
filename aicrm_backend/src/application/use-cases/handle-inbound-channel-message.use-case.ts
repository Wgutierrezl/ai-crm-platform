import { Injectable, Logger } from '@nestjs/common';
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
import {
  WhatsappImagePayload,
  WhatsappInteractiveListPayload,
} from '../../domain/ports/whatsapp-message-sender.port';
import { ToolExecutionService } from '../services/tool-execution.service';
import { AddItemToCartUseCase } from './add-item-to-cart.use-case';
import { ViewCartUseCase } from './view-cart.use-case';
import { ClearCartUseCase } from './clear-cart.use-case';
import { UpdateCartItemQuantityUseCase } from './update-cart-item-quantity.use-case';
import { RemoveCartItemUseCase } from './remove-cart-item.use-case';
import { ConversationStateRepository } from '../../domain/ports/conversation-state.repository.port';
import { ConversationState } from '../../domain/entities/conversation-state.entity';
import { CompanyRepository } from '../../domain/ports/company.repository.port';
import { Company } from '../../domain/entities/company.entity';
import { ConfirmCartCheckoutUseCase } from './confirm-cart-checkout.use-case';

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
  image?: WhatsappImagePayload | null;
  interactiveList?: WhatsappInteractiveListPayload | null;
}

type SelectionResult =
  | { kind: 'product' | 'category'; id: string }
  | { kind: 'cart_add'; productId: string; quantity: number }
  | { kind: 'cart_view' | 'cart_clear' | 'cart_checkout_mock' | 'nav_categories' | 'nav_back' }
  | { kind: 'nav_products'; categoryId: string }
  | { kind: 'cart_increment' | 'cart_decrement' | 'cart_remove'; itemId: string }
  | { kind: 'cart_manage'; itemId: string }
  | { kind: 'cart_decrement_product' | 'cart_remove_product'; productId: string }
  | null;

type DeterministicIntent =
  | 'catalog'
  | 'categories'
  | 'cart_view'
  | 'checkout_start'
  | 'checkout_confirm'
  | 'checkout_cancel'
  | null;

@Injectable()
export class HandleInboundChannelMessageUseCase {
  private readonly logger = new Logger(HandleInboundChannelMessageUseCase.name);

  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly processIncomingMessageUseCase: ProcessIncomingMessageUseCase,
    private readonly onboardingTools: AssistantOnboardingToolsService,
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly toolExecutionService: ToolExecutionService,
    private readonly addItemToCartUseCase: AddItemToCartUseCase,
    private readonly viewCartUseCase: ViewCartUseCase,
    private readonly updateCartItemQuantityUseCase: UpdateCartItemQuantityUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly conversationStateRepository: ConversationStateRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly confirmCartCheckoutUseCase: ConfirmCartCheckoutUseCase,
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
        return { shouldReply: false, reply: null, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
      }
    }

    const resolved = await this.onboardingTools.ASSISTANT_RESOLVE_USER_IDENTITY({
      companyId: input.companyId,
      channel: input.channel,
      externalUserId: input.externalUserId,
      phone: input.phone,
    });

    this.logger.log(
      `[InboundRouter] message="${input.text}" companyId=${input.companyId} customerId=${resolved.customer.id} channel=${input.channel}`,
    );
    this.logger.log(`[InboundRouter] onboardingStatus=${resolved.status} onboardingStep=${resolved.onboardingStep}`);
    this.logger.log(
      `[ConversationContext] current lastSelectedProductId=${String(resolved.state?.context?.lastSelectedProductId ?? 'null')} lastSelectedCategoryId=${String(resolved.state?.context?.lastSelectedCategoryId ?? 'null')}`,
    );
    const company = await this.companyRepository.findById(input.companyId);
    const assistantName = company?.assistantName?.trim() || 'tu asistente virtual';
    this.logger.log(
      `[CompanyAssistantConfig] companyId=${input.companyId} assistantName=${company?.assistantName?.trim() || 'default'} hasWelcomeMessage=${Boolean(company?.assistantWelcomeMessage?.trim())} hasContext=${Boolean(company?.assistantContext?.trim())}`,
    );

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

    if (resolved.status !== 'registered') {
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
      return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
    }

    const directSelection = this.parseInteractiveSelection(input, resolved.state);
    if (directSelection) {
      this.logger.log(`[InboundRouter] deterministicIntent=interactive:${directSelection.kind}`);
      return this.handleSelection(input, resolved, directSelection);
    }

    const deterministicIntent = this.detectDeterministicIntent(input.text);
    this.logger.log(`[InboundRouter] deterministicIntent=${deterministicIntent ?? 'none'}`);

    if (deterministicIntent === 'checkout_start') {
      return this.startMockCheckout(input, resolved);
    }
    if (deterministicIntent === 'checkout_cancel') {
      const cancelResult = await this.cancelMockCheckout(input, resolved);
      if (cancelResult.shouldReply) return cancelResult;
    }
    if (deterministicIntent === 'checkout_confirm') {
      return this.confirmMockCheckout(input, resolved);
    }

    if (deterministicIntent === 'catalog' || deterministicIntent === 'categories') {
      await this.clearSelectedProductContext(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        'deterministic_catalog_or_categories',
      );
      this.logger.log('[InboundRouter] Handling catalog/categories with interactive categories');
      const categoryResult = await this.toolExecutionService.execute('CRM_GET_CATEGORIES', {}, {
        companyId: input.companyId,
        customerId: resolved.customer.id,
        conversationId: resolved.conversation.id,
        channel: input.channel,
      });
      const hasCategories = Boolean(categoryResult.botMetadata?.whatsapp_interactive_list);

      if (hasCategories) {
        const reply = `Hola ${resolved.customer.firstName ?? resolved.customer.fullName ?? 'cliente'} 👋 Estas son las categorias disponibles:`;
        await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply, categoryResult.botMetadata ?? null);
        return {
          shouldReply: true,
          reply,
          recipientExternalUserId: input.externalUserId,
          image: null,
          interactiveList: (categoryResult.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ?? null,
        };
      }

      const productsResult = await this.toolExecutionService.execute('CRM_GET_PRODUCTS', { limit: 10 }, {
        companyId: input.companyId,
        customerId: resolved.customer.id,
        conversationId: resolved.conversation.id,
        channel: input.channel,
      });
      const reply = productsResult.replySuffix?.trim() ?? 'No hay categorias activas ni productos disponibles en este momento.';
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply, productsResult.botMetadata ?? null);
      return {
        shouldReply: true,
        reply,
        recipientExternalUserId: input.externalUserId,
        image: null,
        interactiveList: (productsResult.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ?? null,
      };
    }

    if (deterministicIntent === 'cart_view') {
      await this.clearSelectedProductContext(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        'deterministic_cart_view',
      );
      this.logger.log('[InboundRouter] cartRequested=true clearingSelectedProductContext=true');
      this.logger.log('[InboundRouter] cartRequested=true skipSelectedProductContext=true');
      this.logger.log('[InboundRouter] Handling cart view deterministically');
      const cartView = await this.buildCartReply(input.companyId, resolved.customer.id, resolved.conversation.id, input.channel);
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, cartView.reply, cartView.botMetadata ?? null);
      return {
        shouldReply: true,
        reply: cartView.reply,
        recipientExternalUserId: input.externalUserId,
        image: cartView.image,
        interactiveList: cartView.interactiveList,
      };
    }

    const requestedCategory = await this.resolveCategoryFromText(
      input.companyId,
      input.text,
    );
    this.logger.log(`[InboundRouter] dynamicCategoryMatched=${Boolean(requestedCategory)}`);
    if (requestedCategory) {
      await this.clearSelectedProductContext(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        'text_category_request',
      );
      await this.setSelectedCategoryContext(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        requestedCategory.id,
        'category_selected',
      );
      this.logger.log(
        `[InboundRouter] categoryFlow=true categoryId=${requestedCategory.id} clearingSelectedProductContext=true`,
      );
      this.logger.log('[InboundRouter] categoryProductsRequested=true skipSelectedProductContext=true');
      const categoryResult = await this.toolExecutionService.execute(
        'CRM_GET_PRODUCTS_BY_CATEGORY',
        { categoryId: requestedCategory.id, limit: 10 },
        {
          companyId: input.companyId,
          customerId: resolved.customer.id,
          conversationId: resolved.conversation.id,
          channel: input.channel,
        },
      );
      const reply =
        categoryResult.replySuffix?.trim() ??
        `No pude cargar productos para ${requestedCategory.name} en este momento.`;
      await this.persistBot(
        input.companyId,
        resolved.conversation.id,
        input.channel,
        reply,
        categoryResult.botMetadata ?? null,
      );
      return {
        shouldReply: true,
        reply,
        recipientExternalUserId: input.externalUserId,
        image: null,
        interactiveList:
          (categoryResult.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ??
          null,
      };
    }

    if (this.onboardingTools.isGreetingMessage(input.text)) {
      const welcome = this.buildWelcomeMessage(
        company,
        resolved.customer.firstName ?? resolved.customer.fullName ?? 'de nuevo',
        assistantName,
      );
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, welcome);
      return { shouldReply: true, reply: welcome, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
    }

    this.logger.log('[InboundRouter] Delegating to AI');
    const aiResult = await this.processIncomingMessageUseCase.execute({
      conversationId: resolved.conversation.id,
      companyId: input.companyId,
      customerMessage: input.text,
      persistCustomerMessage: false,
      outputChannel: input.channel,
      botReplyPrefix: '',
      assistantContext: this.buildAssistantContext(
        resolved,
        input.channel,
        company?.assistantContext ?? null,
      ),
    });
    return {
      shouldReply: true,
      reply: aiResult.botMessage.content,
      recipientExternalUserId: input.externalUserId,
      image: null,
      interactiveList: (aiResult.botMessage.metadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ?? null,
    };
  }

  private detectDeterministicIntent(text: string): DeterministicIntent {
    const normalized = this.normalizeText(String(text ?? ''));
    const catalogPhrases = [
      'muestrame productos',
      'muéstrame productos',
      'ver productos',
      'catalogo',
      'catálogo',
      'que venden',
      'qué venden',
    ];
    const categoryPhrases = [
      'muestrame categorias',
      'muéstrame categorias',
      'muestrame categorías',
      'muéstrame categorías',
      'ver categorias',
      'ver categorías',
      'categorias',
      'categorías',
      'mostrar categorias',
      'mostrar categorías',
    ];
    const showProductsPhrases = ['mostrar productos', 'muéstrame productos'];
    const cartPhrases = ['ver carrito', 'mi carrito'];
    const checkoutStartPhrases = [
      'confirmar compra',
      'finalizar compra',
      'comprar carrito',
      'pagar pedido',
      'simular pago',
      'checkout',
      'pagar',
    ];
    const checkoutConfirmPhrases = [
      'si confirmar',
      'sí confirmar',
      'confirmo',
      'confirmar',
      'si',
      'sí',
    ];
    const checkoutCancelPhrases = ['cancelar checkout', 'cancelar compra', 'cancelar'];

    if (
      catalogPhrases.some((p) => normalized.includes(p)) ||
      showProductsPhrases.some((p) => normalized.includes(p))
    ) {
      return 'catalog';
    }
    if (categoryPhrases.some((p) => normalized.includes(p))) return 'categories';
    if (cartPhrases.some((p) => normalized.includes(p))) return 'cart_view';
    if (checkoutStartPhrases.some((p) => normalized.includes(p))) return 'checkout_start';
    if (checkoutCancelPhrases.some((p) => normalized.includes(p))) return 'checkout_cancel';
    if (checkoutConfirmPhrases.some((p) => normalized === p || normalized.includes(p)))
      return 'checkout_confirm';
    return null;
  }

  private async resolveCategoryFromText(
    companyId: string,
    text: string,
  ): Promise<{ id: string; name: string } | null> {
    const categories = await this.categoryRepository.findActiveByCompanyId(companyId);
    this.logger.log(`[CategoryResolver] activeCategories=${categories.length}`);
    const normalizedText = this.normalizeText(text);
    const singularizedText = this.singularizeToken(normalizedText);

    for (const category of categories) {
      const normalizedCategory = this.normalizeText(category.name);
      const singularizedCategory = this.singularizeToken(normalizedCategory);
      const normalizedSlug = this.normalizeText(category.slug ?? '');
      const aliasTokens = this.buildCategoryAliasTokens(category);
      if (
        normalizedText === normalizedCategory ||
        normalizedText.includes(normalizedCategory) ||
        normalizedCategory.includes(normalizedText) ||
        singularizedText.includes(singularizedCategory) ||
        singularizedCategory.includes(singularizedText)
      ) {
        this.logger.log(
          `[CategoryResolver] text="${text}" matchedCategoryId=${category.id} matchedCategoryName=${category.name} strategy=${normalizedText === normalizedCategory ? 'exact' : 'contains'}`,
        );
        return { id: category.id, name: category.name };
      }
      if (
        normalizedSlug &&
        (normalizedText.includes(normalizedSlug) ||
          normalizedSlug.includes(normalizedText))
      ) {
        this.logger.log(
          `[CategoryResolver] text="${text}" matchedCategoryId=${category.id} matchedCategoryName=${category.name} strategy=slug`,
        );
        return { id: category.id, name: category.name };
      }
      const alias = aliasTokens.find(
        (token) =>
          normalizedText.includes(token) || token.includes(normalizedText),
      );
      if (alias) {
        this.logger.log(
          `[CategoryResolver] text="${text}" matchedCategoryId=${category.id} matchedCategoryName=${category.name} strategy=alias`,
        );
        return { id: category.id, name: category.name };
      }
    }

    this.logger.log(
      `[CategoryResolver] text="${text}" matchedCategoryId=null matchedCategoryName=null strategy=none`,
    );
    return null;
  }

  private normalizeText(value: string): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private singularizeToken(value: string): string {
    return value
      .split(' ')
      .map((part) => (part.endsWith('es') ? part.slice(0, -2) : part.endsWith('s') ? part.slice(0, -1) : part))
      .join(' ');
  }

  private buildCategoryAliasTokens(category: {
    name: string;
    slug: string | null;
    description: string | null;
  }): string[] {
    const normalizedName = this.normalizeText(category.name);
    const nameTokens = normalizedName.split(' ').filter((token) => token.length > 2);
    const slugToken = this.normalizeText(category.slug ?? '');
    const descriptionTokens = this.normalizeText(category.description ?? '')
      .split(' ')
      .filter((token) => token.length > 4)
      .slice(0, 4);
    return [...nameTokens, slugToken, ...descriptionTokens].filter(Boolean);
  }

  private async handleSelection(
    input: HandleInboundChannelMessageInput,
    resolved: Awaited<ReturnType<AssistantOnboardingToolsService['ASSISTANT_RESOLVE_USER_IDENTITY']>>,
    directSelection: Exclude<SelectionResult, null>,
  ): Promise<HandleInboundChannelMessageOutput> {
    if (directSelection.kind === 'cart_add') {
      const added = await this.addItemToCartUseCase.execute({
        companyId: input.companyId,
        customerId: resolved.customer.id,
        conversationId: resolved.conversation.id,
        channel: input.channel,
        productId: directSelection.productId,
        quantity: directSelection.quantity,
      });
      const reply = `Listo. Agregue "${added.item.productNameSnapshot}" al carrito. Cantidad actual: ${added.quantityMerged}.`;
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply);
      return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
    }

    if (directSelection.kind === 'cart_view') {
      await this.clearSelectedProductContext(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        'interactive_cart_view',
      );
      this.logger.log('[InboundRouter] cartRequested=true clearingSelectedProductContext=true');
      this.logger.log('[InboundRouter] cartRequested=true skipSelectedProductContext=true');
      const cartView = await this.buildCartReply(input.companyId, resolved.customer.id, resolved.conversation.id, input.channel);
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, cartView.reply, cartView.botMetadata ?? null);
      return { shouldReply: true, reply: cartView.reply, recipientExternalUserId: input.externalUserId, image: cartView.image, interactiveList: cartView.interactiveList };
    }

    if (directSelection.kind === 'cart_clear') {
      await this.clearCartUseCase.execute({ companyId: input.companyId, customerId: resolved.customer.id, conversationId: resolved.conversation.id, channel: input.channel });
      const reply = 'Listo. Tu carrito quedo vacio.';
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply);
      return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
    }

    if (directSelection.kind === 'cart_increment' || directSelection.kind === 'cart_decrement' || directSelection.kind === 'cart_remove') {
      const cart = await this.viewCartUseCase.execute({ companyId: input.companyId, customerId: resolved.customer.id, conversationId: resolved.conversation.id, channel: input.channel });
      const item = cart.items.find((it) => it.id === directSelection.itemId);
      if (!item) return { shouldReply: true, reply: 'No encontre ese item en tu carrito.', recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };

      if (directSelection.kind === 'cart_remove' || (directSelection.kind === 'cart_decrement' && item.quantity <= 1)) {
        await this.removeCartItemUseCase.execute({ companyId: input.companyId, customerId: resolved.customer.id, conversationId: resolved.conversation.id, channel: input.channel, itemId: item.id });
      } else {
        await this.updateCartItemQuantityUseCase.execute({
          companyId: input.companyId,
          customerId: resolved.customer.id,
          conversationId: resolved.conversation.id,
          channel: input.channel,
          itemId: item.id,
          quantity: directSelection.kind === 'cart_increment' ? item.quantity + 1 : item.quantity - 1,
        });
      }
      const cartView = await this.buildCartReply(input.companyId, resolved.customer.id, resolved.conversation.id, input.channel);
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, cartView.reply, cartView.botMetadata ?? null);
      return { shouldReply: true, reply: cartView.reply, recipientExternalUserId: input.externalUserId, image: cartView.image, interactiveList: cartView.interactiveList };
    }

    if (directSelection.kind === 'cart_manage') {
      this.logger.log('[InboundRouter] deterministicIntent=interactive:cart_manage');
      this.logger.log(`[InboundRouter] cartItemId=${directSelection.itemId}`);
      const manageView = await this.buildCartManageReply(input.companyId, resolved.customer.id, resolved.conversation.id, input.channel, directSelection.itemId);
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, manageView.reply, manageView.botMetadata ?? null);
      return {
        shouldReply: true,
        reply: manageView.reply,
        recipientExternalUserId: input.externalUserId,
        image: null,
        interactiveList: manageView.interactiveList,
      };
    }

    if (directSelection.kind === 'cart_decrement_product' || directSelection.kind === 'cart_remove_product') {
      const cart = await this.viewCartUseCase.execute({ companyId: input.companyId, customerId: resolved.customer.id, conversationId: resolved.conversation.id, channel: input.channel });
      const item = cart.items.find((it) => it.productId === directSelection.productId);
      if (!item) return { shouldReply: true, reply: 'No encontre ese producto en tu carrito.', recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };

      if (directSelection.kind === 'cart_remove_product' || item.quantity <= 1) {
        await this.removeCartItemUseCase.execute({ companyId: input.companyId, customerId: resolved.customer.id, conversationId: resolved.conversation.id, channel: input.channel, itemId: item.id });
      } else {
        await this.updateCartItemQuantityUseCase.execute({ companyId: input.companyId, customerId: resolved.customer.id, conversationId: resolved.conversation.id, channel: input.channel, itemId: item.id, quantity: item.quantity - 1 });
      }

      const cartView = await this.buildCartReply(input.companyId, resolved.customer.id, resolved.conversation.id, input.channel);
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, cartView.reply, cartView.botMetadata ?? null);
      return { shouldReply: true, reply: cartView.reply, recipientExternalUserId: input.externalUserId, image: cartView.image, interactiveList: cartView.interactiveList };
    }

    if (directSelection.kind === 'cart_checkout_mock') {
      return this.startMockCheckout(input, resolved);
    }

    if (directSelection.kind === 'nav_categories') {
      await this.clearSelectedProductContext(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        'interactive_nav_categories',
      );
      const categoryResult = await this.toolExecutionService.execute('CRM_GET_CATEGORIES', {}, {
        companyId: input.companyId,
        customerId: resolved.customer.id,
        conversationId: resolved.conversation.id,
        channel: input.channel,
      });
      const reply = `Perfecto, elige una categoria:`;
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply, categoryResult.botMetadata ?? null);
      return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: (categoryResult.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ?? null };
    }

    if (directSelection.kind === 'category' || directSelection.kind === 'nav_products') {
      const categoryId = directSelection.kind === 'nav_products' ? directSelection.categoryId : directSelection.id;
      await this.clearSelectedProductContext(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        'interactive_category_flow',
      );
      await this.setSelectedCategoryContext(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        categoryId,
        'category_selected',
      );
      this.logger.log(`[InboundRouter] categoryFlow=true categoryId=${categoryId} clearingSelectedProductContext=true`);
      this.logger.log('[InboundRouter] categoryProductsRequested=true skipSelectedProductContext=true');
      this.logger.log(`[InboundRouter] categorySelected=${categoryId}`);
      const categoryResult = await this.toolExecutionService.execute('CRM_GET_PRODUCTS_BY_CATEGORY', { categoryId, limit: 10 }, {
        companyId: input.companyId,
        customerId: resolved.customer.id,
        conversationId: resolved.conversation.id,
        channel: input.channel,
      });
      const rows = (categoryResult.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload | undefined)?.sections?.[0]?.rows ?? [];
      this.logger.log(`[InboundRouter] categoryProductsFound count=${rows.length}`);
      if (rows.length > 1) {
        this.logger.log(`[InboundRouter] sendingProductList categoryId=${categoryId} rows=${rows.length}`);
        this.logger.log('[ConversationContext] cleared lastSelectedProductId reason=category_products_list');
      }
      if (rows.length === 1 && rows[0].id.startsWith('product:')) {
        const productId = rows[0].id.replace('product:', '').trim();
        this.logger.log(`[InboundRouter] singleProductCategory=true sendingFullProductDetail=${productId}`);
        const detail = await this.buildSelectedProductReply(input.companyId, productId);
        await this.setSelectedProductContext(
          resolved.state,
          input.companyId,
          resolved.conversation.id,
          productId,
          detail.categoryId,
          'single_product_category_detail',
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
          image: detail.image ?? null,
          interactiveList:
            (detail.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ??
            null,
        };
      }
      const reply = categoryResult.replySuffix?.trim() ?? 'No pude cargar productos de esa categoria en este momento.';
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply, categoryResult.botMetadata ?? null);
      return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: (categoryResult.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ?? null };
    }

    if (directSelection.kind === 'product') {
      this.logger.log(`[InboundRouter] productSelected=${directSelection.id}`);
      const detail = await this.buildSelectedProductReply(input.companyId, directSelection.id);
      await this.setSelectedProductContext(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        directSelection.id,
        detail.categoryId,
        'product_selected',
      );
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, detail.reply, detail.botMetadata ?? null);
      return {
        shouldReply: true,
        reply: detail.reply,
        recipientExternalUserId: input.externalUserId,
        image: detail.image ?? null,
        interactiveList: (detail.botMetadata?.whatsapp_interactive_list as WhatsappInteractiveListPayload) ?? null,
      };
    }

    return { shouldReply: false, reply: null, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
  }

  private async persistBot(companyId: string, conversationId: string, channel: 'whatsapp', content: string, metadata: Record<string, unknown> | null = null): Promise<void> {
    await this.messageRepository.create(new Message(uuidv4(), conversationId, companyId, content, 'bot', new Date(), channel, null, metadata));
  }

  private parseInteractiveSelection(input: HandleInboundChannelMessageInput, state: ConversationState | null): SelectionResult {
    const metadataId = String(input.metadata?.interactiveReplyId ?? '').trim().toLowerCase();
    const normalizedText = String(input.text ?? '').trim().toLowerCase();
    const candidate = metadataId || normalizedText;

    if (candidate.startsWith('product:')) return { kind: 'product', id: candidate.replace('product:', '').trim() };
    if (candidate.startsWith('category:')) return { kind: 'category', id: candidate.replace('category:', '').trim() };
    if (candidate.startsWith('cart:add:') || candidate.startsWith('cart_add:')) {
      const parts = candidate.replace('cart_add:', 'cart:add:').split(':');
      return { kind: 'cart_add', productId: String(parts[2] ?? '').trim(), quantity: Math.max(1, Number(parts[3] ?? '1')) };
    }
    if (candidate === 'cart:view' || candidate === 'cart_view' || normalizedText === 'ver carrito') return { kind: 'cart_view' };
    if (candidate === 'cart:clear' || candidate === 'cart_clear' || normalizedText === 'limpiar carrito') return { kind: 'cart_clear' };
    if (candidate.startsWith('cart:increment:')) return { kind: 'cart_increment', itemId: candidate.split(':')[2] ?? '' };
    if (candidate.startsWith('cart:decrement:')) return { kind: 'cart_decrement', itemId: candidate.split(':')[2] ?? '' };
    if (candidate.startsWith('cart:remove:')) return { kind: 'cart_remove', itemId: candidate.split(':')[2] ?? '' };
    if (candidate.startsWith('cart:manage:')) return { kind: 'cart_manage', itemId: candidate.split(':')[2] ?? '' };
    if (candidate === 'cart:checkout_mock') return { kind: 'cart_checkout_mock' };
    if (candidate === 'nav:categories') return { kind: 'nav_categories' };
    if (candidate === 'nav:back') return { kind: 'nav_back' };
    if (candidate.startsWith('nav:products:')) return { kind: 'nav_products', categoryId: candidate.replace('nav:products:', '').trim() };

    const lastProductId = String(state?.context?.lastSelectedProductId ?? '').trim();
    const qtyMatch = normalizedText.match(/(agrega|quiero|sumale|súmale)\s+(\d+)/i) ?? normalizedText.match(/(\d+)\s+unidades?/i);
    const blockedContextWords = /(categor[ií]a|categor[ií]as|productos|cat[aá]logo|carrito|ver carrito|mostrar carrito)/i.test(normalizedText);
    if (blockedContextWords) return null;
    if (lastProductId && /(elimina este producto|quitar este producto)/i.test(normalizedText)) return { kind: 'cart_remove_product', productId: lastProductId };
    if (lastProductId && /(quita una|resta una|quitale una|quítale una)/i.test(normalizedText)) return { kind: 'cart_decrement_product', productId: lastProductId };
    if (lastProductId && /(este producto|agrega este producto|sumale otra|súmale otra|agrega otra|^agrega\s+\d+)/i.test(normalizedText)) {
      const qty = qtyMatch ? Number(qtyMatch[2] ?? qtyMatch[1]) : 1;
      return { kind: 'cart_add', productId: lastProductId, quantity: Number.isFinite(qty) && qty > 0 ? qty : 1 };
    }

    return null;
  }

  private async buildSelectedProductReply(companyId: string, productId: string): Promise<{ reply: string; image?: WhatsappImagePayload; botMetadata?: Record<string, unknown>; categoryId: string | null }> {
    const product = await this.productRepository.findByIdAndCompanyId(productId, companyId);
    if (!product || !product.isActive) return { reply: 'Ese producto ya no esta disponible en este momento.', categoryId: null };

    let categoryName = 'Sin categoria';
    if (product.categoryId) {
      const category = await this.categoryRepository.findById(product.categoryId, companyId);
      if (!category || !category.isActive) return { reply: 'Ese producto no esta disponible para catalogo publico en este momento.', categoryId: null };
      categoryName = category.name;
    }

    const detailText = [
      'Producto seleccionado:',
      '',
      product.name,
      (product.description ?? 'Sin descripcion disponible').slice(0, 180),
      '',
      `Precio: ${product.currency} ${product.price}`,
      `Stock: ${product.stock}`,
      `Categoria: ${categoryName}`,
    ].join('\n');
    this.logger.log(
      `[ProductUX] sendingDetail productId=${product.id} hasImage=${Boolean(product.imageUrl)}`,
    );

    const actionRows = [
      { id: `cart:add:${product.id}:1`, title: 'Agregar al carrito', description: 'Agregar 1 unidad' },
      { id: 'cart:view', title: 'Ver carrito', description: 'Revisar carrito actual' },
      { id: product.categoryId ? `nav:products:${product.categoryId}` : 'nav:categories', title: 'Volver a productos', description: 'Ver mas productos' },
      { id: 'nav:categories', title: 'Cambiar categoria', description: 'Elegir otra categoria' },
    ];
    this.logger.log(`[ProductUX] sendingActions productId=${product.id} rows=${actionRows.length}`);

    return {
      reply: detailText,
      image: product.imageUrl ? { imageUrl: product.imageUrl, caption: detailText } : undefined,
      categoryId: product.categoryId ?? null,
      botMetadata: {
        whatsapp_interactive_list: {
          header: 'Producto seleccionado',
          body: 'Que quieres hacer ahora?',
          buttonText: 'Opciones',
          sections: [{ title: 'Acciones de producto', rows: [
            ...actionRows,
          ] }],
        } as WhatsappInteractiveListPayload,
      },
    };
  }

  private async buildCartReply(companyId: string, customerId: string, conversationId: string, channel: 'whatsapp'): Promise<{ reply: string; image?: WhatsappImagePayload | null; interactiveList: WhatsappInteractiveListPayload | null; botMetadata?: Record<string, unknown> }> {
    this.logger.log('[InboundRouter] cartRequested=true');
    this.logger.log('[CartUX] cartViewRequested=true sendFirstItemImage=false');
    const cart = await this.viewCartUseCase.execute({ companyId, customerId, conversationId, channel });
    if (cart.items.length === 0) {
      const interactiveList: WhatsappInteractiveListPayload = {
        header: 'Carrito', body: 'Tu carrito esta vacio. Que quieres hacer?', buttonText: 'Opciones',
        sections: [{ title: 'Navegacion', rows: [{ id: 'nav:categories', title: 'Seguir comprando', description: 'Ver categorias' }] }],
      };
      this.logger.log('[CartUX] sendingCartSummary items=0 total=0');
      this.logger.log(
        `[CartUX] sendingCartManagementList rows=${interactiveList.sections.reduce((acc, section) => acc + section.rows.length, 0)}`,
      );
      return { reply: 'Tu carrito esta vacio. Puedes agregar productos desde el catalogo.', image: null, interactiveList, botMetadata: { whatsapp_interactive_list: interactiveList } };
    }

    const lines = cart.items.map((item, i) => `${i + 1}. ${item.productNameSnapshot}\nCantidad: ${item.quantity}\nPrecio unitario: ${item.currencySnapshot} ${item.unitPriceSnapshot}\nSubtotal: ${item.currencySnapshot} ${item.quantity * item.unitPriceSnapshot}`);
    const reply = `Tu carrito:\n\n${lines.join('\n\n')}\n\nTotal items: ${cart.totals.totalItems}\nTotal: ${cart.totals.currency} ${cart.totals.subtotal}`;
    this.logger.log(`[CartUX] sendingCartSummary items=${cart.items.length} total=${cart.totals.subtotal}`);

    const itemRows = cart.items.slice(0, 7).map((item) => ({
      id: `cart:manage:${item.id}`,
      title: `Gestionar ${item.productNameSnapshot}`.slice(0, 24),
      description: `Cant ${item.quantity} | ${item.currencySnapshot} ${item.unitPriceSnapshot}`,
    }));

    const interactiveList: WhatsappInteractiveListPayload = {
      header: 'Carrito', body: 'Acciones de carrito disponibles:', buttonText: 'Gestionar',
      sections: [
        { title: 'Items', rows: itemRows },
        { title: 'General', rows: [
          { id: 'cart:clear', title: 'Vaciar carrito', description: 'Eliminar todos los items' },
          { id: 'nav:categories', title: 'Seguir comprando', description: 'Volver al catalogo' },
          { id: 'cart:checkout_mock', title: 'Confirmar compra', description: 'Checkout mock' },
        ] },
      ],
    };
    const totalRows = interactiveList.sections.reduce((acc, section) => acc + section.rows.length, 0);
    this.logger.log(`[CartUX] Building cart overview interactive list items=${cart.items.length} rows=${totalRows}`);
    this.logger.log(`[CartUX] sendingCartManagementList rows=${totalRows}`);

    return { reply, image: null, interactiveList, botMetadata: { whatsapp_interactive_list: interactiveList } };
  }

  private async buildCartManageReply(
    companyId: string,
    customerId: string,
    conversationId: string,
    channel: 'whatsapp',
    cartItemId: string,
  ): Promise<{ reply: string; interactiveList: WhatsappInteractiveListPayload | null; botMetadata?: Record<string, unknown> }> {
    const cart = await this.viewCartUseCase.execute({ companyId, customerId, conversationId, channel });
    const item = cart.items.find((it) => it.id === cartItemId);
    if (!item) {
      const fallback = await this.buildCartReply(companyId, customerId, conversationId, channel);
      return {
        reply: 'No encontre ese producto en tu carrito. Te muestro el carrito actualizado.',
        interactiveList: fallback.interactiveList,
        botMetadata: fallback.botMetadata,
      };
    }

    const interactiveList: WhatsappInteractiveListPayload = {
      header: 'Gestion de producto',
      body: `Que quieres hacer con ${item.productNameSnapshot}?`,
      buttonText: 'Opciones',
      sections: [
        {
          title: 'Acciones',
          rows: [
            { id: `cart:increment:${item.id}`, title: 'Aumentar +1', description: 'Sumar una unidad' },
            { id: `cart:decrement:${item.id}`, title: 'Reducir -1', description: 'Restar una unidad' },
            { id: `cart:remove:${item.id}`, title: 'Eliminar producto', description: 'Quitar del carrito' },
            { id: 'cart:view', title: 'Volver al carrito', description: 'Ver resumen del carrito' },
            { id: 'nav:categories', title: 'Seguir comprando', description: 'Volver a categorias' },
            { id: 'cart:checkout_mock', title: 'Confirmar compra', description: 'Checkout mock' },
          ],
        },
      ],
    };
    const totalRows = interactiveList.sections.reduce((acc, section) => acc + section.rows.length, 0);
    this.logger.log(`[CartUX] Building cart item manage list cartItemId=${item.id} rows=${totalRows}`);

    return {
      reply: `Gestionando "${item.productNameSnapshot}".`,
      interactiveList,
      botMetadata: { whatsapp_interactive_list: interactiveList },
    };
  }

  private async clearSelectedProductContext(
    state: ConversationState | null,
    companyId: string,
    conversationId: string,
    reason: string,
  ): Promise<void> {
    if (!state) return;
    const currentProductId = String(state.context?.lastSelectedProductId ?? '').trim();
    if (!currentProductId) return;
    this.logger.log(`[ConversationContext] cleared lastSelectedProductId reason=${reason}`);
    await this.conversationStateRepository.update(
      new ConversationState(
        state.id,
        conversationId,
        companyId,
        state.status,
        state.registrationStep,
        {
          ...(state.context ?? {}),
          lastSelectedProductId: null,
        },
        state.createdAt,
        new Date(),
      ),
    );
  }

  private async setSelectedProductContext(
    state: ConversationState | null,
    companyId: string,
    conversationId: string,
    productId: string,
    categoryId: string | null,
    reason: string,
  ): Promise<void> {
    if (!state) return;
    this.logger.log(`[ConversationContext] set lastSelectedProductId=${productId} reason=${reason}`);
    await this.conversationStateRepository.update(
      new ConversationState(
        state.id,
        conversationId,
        companyId,
        state.status,
        state.registrationStep,
        {
          ...(state.context ?? {}),
          lastSelectedProductId: productId,
          lastSelectedCategoryId: categoryId,
        },
        state.createdAt,
        new Date(),
      ),
    );
  }

  private async setSelectedCategoryContext(
    state: ConversationState | null,
    companyId: string,
    conversationId: string,
    categoryId: string,
    reason: string,
  ): Promise<void> {
    if (!state) return;
    this.logger.log(`[ConversationContext] set lastSelectedCategoryId=${categoryId} reason=${reason}`);
    await this.conversationStateRepository.update(
      new ConversationState(
        state.id,
        conversationId,
        companyId,
        state.status,
        state.registrationStep,
        {
          ...(state.context ?? {}),
          lastSelectedCategoryId: categoryId,
        },
        state.createdAt,
        new Date(),
      ),
    );
  }

  private getCheckoutState(state: ConversationState | null): string | null {
    return String(state?.context?.checkoutState ?? '').trim() || null;
  }

  private async startMockCheckout(
    input: HandleInboundChannelMessageInput,
    resolved: Awaited<
      ReturnType<AssistantOnboardingToolsService['ASSISTANT_RESOLVE_USER_IDENTITY']>
    >,
  ): Promise<HandleInboundChannelMessageOutput> {
    const cart = await this.viewCartUseCase.execute({
      companyId: input.companyId,
      customerId: resolved.customer.id,
      conversationId: resolved.conversation.id,
      channel: input.channel,
    });
    if (cart.items.length === 0) {
      const reply = 'No hay productos en tu carrito para comprar.';
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply);
      return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
    }

    const lines = cart.items.map(
      (item, idx) =>
        `${idx + 1}. ${item.productNameSnapshot} x${item.quantity} = ${item.currencySnapshot} ${item.quantity * item.unitPriceSnapshot}`,
    );
    const reply = [
      'Resumen de tu compra (checkout mock):',
      '',
      ...lines,
      '',
      `Subtotal/Total: ${cart.totals.currency} ${cart.totals.subtotal}`,
      `Moneda: ${cart.totals.currency}`,
      '',
      'Escribe "si confirmar" para simular pago o "cancelar" para detener.',
    ].join('\n');
    await this.persistCheckoutState(
      resolved.state,
      input.companyId,
      resolved.conversation.id,
      'CHECKOUT_WAITING_CONFIRMATION',
    );
    await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply);
    return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
  }

  private async confirmMockCheckout(
    input: HandleInboundChannelMessageInput,
    resolved: Awaited<
      ReturnType<AssistantOnboardingToolsService['ASSISTANT_RESOLVE_USER_IDENTITY']>
    >,
  ): Promise<HandleInboundChannelMessageOutput> {
    if (this.getCheckoutState(resolved.state) !== 'CHECKOUT_WAITING_CONFIRMATION') {
      const reply = 'Primero revisemos tu carrito. Escribe "confirmar compra" para iniciar checkout.';
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply);
      return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
    }

    const result = await this.confirmCartCheckoutUseCase.execute({
      companyId: input.companyId,
      customerId: resolved.customer.id,
      conversationId: resolved.conversation.id,
      channel: input.channel,
      paymentScenario: 'approved',
    });
    if (result.paymentStatus === 'approved' && result.order) {
      await this.persistCheckoutState(
        resolved.state,
        input.companyId,
        resolved.conversation.id,
        'CHECKOUT_COMPLETED',
      );
      const reply = `Pago mock aprobado. Tu orden ${result.order.id.slice(0, 8)} fue creada por ${result.order.total}.`;
      await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply);
      return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
    }

    await this.persistCheckoutState(
      resolved.state,
      input.companyId,
      resolved.conversation.id,
      'CHECKOUT_FAILED',
    );
    const reply =
      result.paymentStatus === 'pending'
        ? 'Tu pago mock quedo pendiente. El carrito sigue activo para reintentar.'
        : 'El pago mock fue rechazado o fallo. Tu carrito sigue activo para reintentar.';
    await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply);
    return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
  }

  private async cancelMockCheckout(
    input: HandleInboundChannelMessageInput,
    resolved: Awaited<
      ReturnType<AssistantOnboardingToolsService['ASSISTANT_RESOLVE_USER_IDENTITY']>
    >,
  ): Promise<HandleInboundChannelMessageOutput> {
    const checkoutState = this.getCheckoutState(resolved.state);
    if (!checkoutState || !checkoutState.startsWith('CHECKOUT_')) {
      return { shouldReply: false, reply: null, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
    }
    await this.persistCheckoutState(
      resolved.state,
      input.companyId,
      resolved.conversation.id,
      'CHECKOUT_FAILED',
    );
    const reply = 'Checkout cancelado. Tu carrito permanece activo.';
    await this.persistBot(input.companyId, resolved.conversation.id, input.channel, reply);
    return { shouldReply: true, reply, recipientExternalUserId: input.externalUserId, image: null, interactiveList: null };
  }

  private async persistCheckoutState(
    state: ConversationState | null,
    companyId: string,
    conversationId: string,
    checkoutState: string,
  ): Promise<void> {
    if (!state) return;
    await this.conversationStateRepository.update(
      new ConversationState(
        state.id,
        conversationId,
        companyId,
        state.status,
        state.registrationStep,
        {
          ...(state.context ?? {}),
          checkoutState,
        },
        state.createdAt,
        new Date(),
      ),
    );
  }

  private buildOnboardingReply(input: { currentStep: OnboardingStep; nextStep: OnboardingStep; validationError: string | null; firstName: string | null; isNew: boolean; }): string {
    if (input.validationError === 'name') return 'Para registrarte necesito tu nombre real. Ejemplo: "Walter Gutierrez".';
    if (input.validationError === 'email') return 'Ese correo no parece valido. Me lo compartes de nuevo? Ejemplo: nombre@correo.com';
    if (input.validationError === 'document') return 'La cedula no parece valida. Puedes enviarla de nuevo u omitirla.';
    if (input.currentStep === 'WAITING_NAME' && input.nextStep === 'WAITING_EMAIL') return `Excelente ${input.firstName ?? ''}. Me compartes tu correo?`.trim();
    if (input.currentStep === 'WAITING_EMAIL' && input.nextStep === 'WAITING_DOCUMENT') return 'Perfecto. Quieres compartirme tu numero de cedula? Es opcional.';
    if (input.nextStep === 'COMPLETED') return `Listo ${input.firstName ?? ''}. Tu registro quedo completo. Que te gustaria hacer?`.trim();
    if (input.isNew) return 'Hola. Bienvenido a AI CRM. Antes de comenzar, como te llamas?';
    return 'Continuemos con tu registro. Como te llamas?';
  }

  private buildAssistantContext(
    resolved: Awaited<
      ReturnType<AssistantOnboardingToolsService['ASSISTANT_RESOLVE_USER_IDENTITY']>
    >,
    channel: string,
    assistantContext: string | null = null,
  ): Record<string, unknown> {
    return {
      customer_exists: resolved.customerExists,
      customer_id: resolved.customer.id,
      customer_name: resolved.customer.firstName ?? resolved.customer.fullName ?? null,
      onboarding_completed: resolved.onboardingCompleted,
      onboarding_step: resolved.onboardingStep,
      missing_fields: resolved.missingFields,
      conversation_state: resolved.state?.registrationStep ?? null,
      conversation_context: resolved.state?.context ?? null,
      conversation_id: resolved.conversation.id,
      available_tools: ['CRM_GET_CATEGORIES', 'CRM_SEARCH_CATEGORIES', 'CRM_GET_PRODUCTS_BY_CATEGORY', 'CRM_GET_CATEGORY_BY_NAME', 'CRM_GET_PRODUCTS', 'CRM_SEARCH_PRODUCTS', 'CRM_GET_PRODUCT_BY_NAME', 'CRM_FILTER_PRODUCTS_BY_PRICE', 'CRM_GET_PRODUCT_STOCK', 'CRM_SEARCH_PRODUCTS_BY_CATEGORY_OR_TEXT', 'CRM_GET_PRODUCTS_BY_CATEGORY_AND_PRICE', 'CART_GET_ACTIVE_SESSION', 'CART_ADD_ITEM', 'CART_VIEW', 'CART_UPDATE_ITEM_QUANTITY', 'CART_INCREMENT_ITEM_QUANTITY', 'CART_DECREMENT_ITEM_QUANTITY', 'CART_REMOVE_ITEM', 'CART_CLEAR', 'CART_EXPIRE_OLD_SESSIONS'],
      current_channel: channel,
      tenant_assistant_context: assistantContext,
    };
  }

  private buildWelcomeMessage(
    company: Company | null,
    customerName: string,
    assistantName: string,
  ): string {
    const companyName = company?.name ?? '';
    const custom = company?.assistantWelcomeMessage?.trim();
    if (custom) {
      return custom
        .replaceAll('{{customerName}}', customerName)
        .replaceAll('{{assistantName}}', assistantName)
        .replaceAll('{{companyName}}', companyName);
    }
    return `Hola ${customerName} 👋 Soy ${assistantName}, tu asistente virtual.\n\nPuedo ayudarte a consultar productos, explorar categorias y gestionar tu carrito de compras.\n\nQue te gustaria hacer?`;
  }
}
