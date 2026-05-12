import { HandleInboundChannelMessageUseCase } from './handle-inbound-channel-message.use-case';
import { ConversationState } from '../../domain/entities/conversation-state.entity';

describe('HandleInboundChannelMessageUseCase onboarding email', () => {
  const state = new ConversationState(
    'state-1',
    'conv-1',
    'company-1',
    'active',
    'WAITING_EMAIL',
    {},
    new Date(),
    new Date(),
  );

  const build = (email: string | null) => {
    const messageRepository = {
      findByChannelMessageId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
    };
    const processIncomingMessageUseCase = {
      execute: jest.fn().mockResolvedValue({ botMessage: { content: 'ai', metadata: null } }),
    };
    const onboardingTools = {
      ASSISTANT_RESOLVE_USER_IDENTITY: jest.fn().mockResolvedValue({
        status: 'onboarding_pending',
        customerExists: true,
        onboardingCompleted: false,
        onboardingStep: 'WAITING_EMAIL',
        missingFields: ['email'],
        identity: { id: 'ext-1' },
        customer: { id: 'customer-1', firstName: 'Ana', fullName: 'Ana Diaz' },
        conversation: { id: 'conv-1' },
        state,
      }),
      ASSISTANT_START_ONBOARDING: jest.fn().mockResolvedValue(state),
      ASSISTANT_COLLECT_PROFILE_DATA: jest.fn().mockResolvedValue({
        customer: { id: 'customer-1', firstName: 'Ana', fullName: 'Ana Diaz', email },
        state: new ConversationState(
          'state-1',
          'conv-1',
          'company-1',
          'active',
          'COMPLETED',
          {},
          new Date(),
          new Date(),
        ),
        nextStep: 'COMPLETED',
        completed: true,
        validationError: null,
      }),
      isGreetingMessage: jest.fn().mockReturnValue(false),
    };
    const transactionalEmailService = {
      sendWelcomeOnOnboardingCompleted: jest.fn().mockResolvedValue(undefined),
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    };

    const uc = new HandleInboundChannelMessageUseCase(
      messageRepository as any,
      processIncomingMessageUseCase as any,
      onboardingTools as any,
      { findByIdAndCompanyId: jest.fn(), findById: jest.fn() } as any,
      { findActiveByCompanyId: jest.fn().mockResolvedValue([]), findById: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { execute: jest.fn() } as any,
      { update: jest.fn() } as any,
      { findById: jest.fn().mockResolvedValue({ id: 'company-1', assistantName: 'Bot' }) } as any,
      { execute: jest.fn() } as any,
      transactionalEmailService as any,
      { execute: jest.fn() } as any,
    );
    return { uc, transactionalEmailService };
  };

  it('sends welcome email when onboarding completes with valid email', async () => {
    const { uc, transactionalEmailService } = build('ana@example.com');
    await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'ana@example.com',
      channelMessageId: 'm-1',
    });
    expect(transactionalEmailService.sendWelcomeOnOnboardingCompleted).toHaveBeenCalledTimes(1);
  });

  it('attempts welcome flow but does not break when email is missing', async () => {
    const { uc, transactionalEmailService } = build(null);
    const result = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'listo',
      channelMessageId: 'm-2',
    });
    expect(result.shouldReply).toBe(true);
    expect(transactionalEmailService.sendWelcomeOnOnboardingCompleted).toHaveBeenCalledTimes(1);
  });
});
