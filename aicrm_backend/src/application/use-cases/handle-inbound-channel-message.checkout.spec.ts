import { HandleInboundChannelMessageUseCase } from './handle-inbound-channel-message.use-case';
import { ConversationState } from '../../domain/entities/conversation-state.entity';

describe('HandleInboundChannelMessageUseCase checkout flow', () => {
  const baseState = new ConversationState(
    'state-1',
    'conv-1',
    'company-1',
    'active',
    'COMPLETED',
    {},
    new Date(),
    new Date(),
  );

  const build = (options?: { duplicatedInbound?: boolean }) => {
    const messageRepository = {
      findByChannelMessageId: jest
        .fn()
        .mockResolvedValue(options?.duplicatedInbound ? { id: 'existing-msg' } : null),
      create: jest.fn().mockResolvedValue(undefined),
    };
    const processIncomingMessageUseCase = {
      execute: jest.fn().mockResolvedValue({ botMessage: { content: 'ai', metadata: null } }),
    };
    const onboardingTools = {
      ASSISTANT_RESOLVE_USER_IDENTITY: jest.fn().mockResolvedValue({
        status: 'registered',
        customerExists: true,
        onboardingCompleted: true,
        onboardingStep: 'COMPLETED',
        missingFields: [],
        identity: { id: 'ext-1' },
        customer: { id: 'customer-1', firstName: 'Ana', fullName: 'Ana Diaz' },
        conversation: { id: 'conv-1' },
        state: baseState,
      }),
      isGreetingMessage: jest.fn().mockReturnValue(false),
    };
    const toolExecutionService = { execute: jest.fn() };
    const addItemToCartUseCase = { execute: jest.fn() };
    const viewCartUseCase = {
      execute: jest.fn().mockResolvedValue({
        session: { id: 's1' },
        items: [{ id: 'i1', productId: 'p1', productNameSnapshot: 'Prod 1', quantity: 2, unitPriceSnapshot: 100, currencySnapshot: 'COP' }],
        totals: { totalItems: 2, subtotal: 200, currency: 'COP' },
      }),
    };
    const updateCartItemQuantityUseCase = { execute: jest.fn() };
    const removeCartItemUseCase = { execute: jest.fn() };
    const clearCartUseCase = { execute: jest.fn() };
    const conversationStateRepository = {
      create: jest.fn().mockResolvedValue(baseState),
      update: jest.fn().mockResolvedValue(baseState),
    };
    const companyRepository = { findById: jest.fn().mockResolvedValue({ id: 'company-1', assistantName: 'Bot' }) };
    const confirmCartCheckoutUseCase = {
      execute: jest.fn().mockResolvedValue({
        paymentStatus: 'approved',
        order: { id: 'order-1', total: 200 },
        orderItems: [],
        paymentTransaction: null,
      }),
    };
    const transactionalEmailService = {
      sendWelcomeOnOnboardingCompleted: jest.fn().mockResolvedValue(undefined),
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    };
    const categoryRepository = { findActiveByCompanyId: jest.fn().mockResolvedValue([]), findById: jest.fn() };
    const productRepository = { findByIdAndCompanyId: jest.fn(), findById: jest.fn() };

    const uc = new HandleInboundChannelMessageUseCase(
      messageRepository as any,
      processIncomingMessageUseCase as any,
      onboardingTools as any,
      productRepository as any,
      categoryRepository as any,
      toolExecutionService as any,
      addItemToCartUseCase as any,
      viewCartUseCase as any,
      updateCartItemQuantityUseCase as any,
      removeCartItemUseCase as any,
      clearCartUseCase as any,
      conversationStateRepository as any,
      companyRepository as any,
      confirmCartCheckoutUseCase as any,
      transactionalEmailService as any,
      { execute: jest.fn() } as any,
    );
    return {
      uc,
      confirmCartCheckoutUseCase,
      conversationStateRepository,
      onboardingTools,
      toolExecutionService,
      messageRepository,
    };
  };

  it('starts checkout when user writes confirmar compra', async () => {
    const { uc, conversationStateRepository } = build();
    const result = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'confirmar compra',
      channelMessageId: 'm-1',
    });
    expect(result.shouldReply).toBe(true);
    expect(result.reply).toContain('Resumen de tu compra');
    expect(conversationStateRepository.update).toHaveBeenCalled();
  });

  it('confirms checkout with si confirmar', async () => {
    const { uc, onboardingTools, confirmCartCheckoutUseCase } = build();
    onboardingTools.ASSISTANT_RESOLVE_USER_IDENTITY.mockResolvedValueOnce({
      status: 'registered',
      customerExists: true,
      onboardingCompleted: true,
      onboardingStep: 'COMPLETED',
      missingFields: [],
      identity: { id: 'ext-1' },
      customer: { id: 'customer-1', firstName: 'Ana', fullName: 'Ana Diaz' },
      conversation: { id: 'conv-1' },
      state: new ConversationState('state-1', 'conv-1', 'company-1', 'active', 'COMPLETED', { checkoutState: 'CHECKOUT_WAITING_CONFIRMATION' }, new Date(), new Date()),
    });
    const result = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'si confirmar',
      channelMessageId: 'm-2',
    });
    expect(result.reply).toContain('Pago mock aprobado');
    expect(confirmCartCheckoutUseCase.execute).toHaveBeenCalled();
    expect(confirmCartCheckoutUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'whatsapp:whatsapp:m-2',
      }),
    );
  });

  it('cancelar keeps flow isolated and responds when checkout is active', async () => {
    const { uc, onboardingTools } = build();
    onboardingTools.ASSISTANT_RESOLVE_USER_IDENTITY.mockResolvedValueOnce({
      status: 'registered',
      customerExists: true,
      onboardingCompleted: true,
      onboardingStep: 'COMPLETED',
      missingFields: [],
      identity: { id: 'ext-1' },
      customer: { id: 'customer-1', firstName: 'Ana', fullName: 'Ana Diaz' },
      conversation: { id: 'conv-1' },
      state: new ConversationState('state-1', 'conv-1', 'company-1', 'active', 'COMPLETED', { checkoutState: 'CHECKOUT_WAITING_CONFIRMATION' }, new Date(), new Date()),
    });
    const result = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'cancelar',
      channelMessageId: 'm-3',
    });
    expect(result.reply).toContain('Checkout cancelado');
  });

  it('does not interfere with category:<id> selection', async () => {
    const { uc, confirmCartCheckoutUseCase, toolExecutionService } = build();
    toolExecutionService.execute.mockResolvedValue({
      replySuffix: 'Productos en categoria',
      botMetadata: { whatsapp_interactive_list: { header: 'h', body: 'b', buttonText: 'x', sections: [{ title: 't', rows: [] }] } },
    });
    const result = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'category:cat-1',
      channelMessageId: 'm-4',
      metadata: { interactiveReplyId: 'category:cat-1' },
    });
    expect(result.shouldReply).toBe(true);
    expect(confirmCartCheckoutUseCase.execute).not.toHaveBeenCalled();
  });

  it('does not process duplicated channel message id', async () => {
    const { uc, confirmCartCheckoutUseCase, messageRepository } = build({
      duplicatedInbound: true,
    });
    const duplicatedResult = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'si confirmar',
      channelMessageId: 'm-dup',
    });

    expect(duplicatedResult.shouldReply).toBe(false);
    expect(messageRepository.create).not.toHaveBeenCalled();
    expect(confirmCartCheckoutUseCase.execute).not.toHaveBeenCalled();
  });

  it('creates conversation state when checkout starts from interactive action and state is null', async () => {
    const { uc, onboardingTools, conversationStateRepository } = build();
    onboardingTools.ASSISTANT_RESOLVE_USER_IDENTITY.mockResolvedValueOnce({
      status: 'registered',
      customerExists: true,
      onboardingCompleted: true,
      onboardingStep: 'COMPLETED',
      missingFields: [],
      identity: { id: 'ext-1' },
      customer: { id: 'customer-1', firstName: 'Ana', fullName: 'Ana Diaz' },
      conversation: { id: 'conv-1' },
      state: null,
    });

    const result = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'cart:checkout_mock',
      channelMessageId: 'm-5',
      metadata: { interactiveReplyId: 'cart:checkout_mock' },
    });

    expect(result.reply).toContain('Resumen de tu compra');
    expect(conversationStateRepository.create).toHaveBeenCalledTimes(1);
  });
});
