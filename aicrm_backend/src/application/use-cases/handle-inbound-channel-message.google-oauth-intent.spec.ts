import { HandleInboundChannelMessageUseCase } from './handle-inbound-channel-message.use-case';

describe('HandleInboundChannelMessageUseCase Google OAuth intent', () => {
  const build = (status: 'registered' | 'onboarding_pending') => {
    const messageRepository = {
      findByChannelMessageId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
    };
    const processIncomingMessageUseCase = {
      execute: jest
        .fn()
        .mockResolvedValue({ botMessage: { content: 'respuesta ia', metadata: null } }),
    };
    const onboardingTools = {
      ASSISTANT_RESOLVE_USER_IDENTITY: jest.fn().mockResolvedValue({
        status,
        customerExists: true,
        onboardingCompleted: status === 'registered',
        onboardingStep: status === 'registered' ? 'COMPLETED' : 'WAITING_NAME',
        missingFields: status === 'registered' ? [] : ['firstName', 'email'],
        identity: { id: 'ext-1' },
        customer: { id: 'customer-1', firstName: null, fullName: null },
        conversation: { id: 'conv-1' },
        state: null,
      }),
      ASSISTANT_START_ONBOARDING: jest.fn(),
      ASSISTANT_COLLECT_PROFILE_DATA: jest.fn(),
      isGreetingMessage: jest.fn().mockReturnValue(false),
    };
    const startCustomerGoogleOAuthUseCase = {
      execute: jest
        .fn()
        .mockResolvedValue({ authorizationUrl: 'https://accounts.google.com/mock', expiresAt: new Date() }),
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
      {
        sendWelcomeOnOnboardingCompleted: jest.fn(),
        sendOrderConfirmation: jest.fn(),
      } as any,
      startCustomerGoogleOAuthUseCase as any,
    );

    return { uc, startCustomerGoogleOAuthUseCase, processIncomingMessageUseCase };
  };

  it('new/incomplete customer asking for google receives oauth link', async () => {
    const { uc, startCustomerGoogleOAuthUseCase } = build('onboarding_pending');
    const result = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'registrame con google',
      channelMessageId: 'm-1',
    });

    expect(startCustomerGoogleOAuthUseCase.execute).toHaveBeenCalledTimes(1);
    expect(result.reply).toContain('boton');
    expect(result.urlButton?.url).toBe('https://accounts.google.com/mock');
  });

  it('registered customer asking for google does not restart onboarding', async () => {
    const { uc, startCustomerGoogleOAuthUseCase } = build('registered');
    const result = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'continuar con google',
      channelMessageId: 'm-2',
    });

    expect(startCustomerGoogleOAuthUseCase.execute).not.toHaveBeenCalled();
    expect(result.reply).toContain('registro ya esta completo');
  });

  it('ambiguous phrase falls back to AI flow', async () => {
    const { uc, startCustomerGoogleOAuthUseCase, processIncomingMessageUseCase } =
      build('registered');
    const result = await uc.execute({
      companyId: 'company-1',
      channel: 'whatsapp',
      externalUserId: 'wa-1',
      phone: '300',
      text: 'tienen google pixel?',
      channelMessageId: 'm-3',
    });

    expect(startCustomerGoogleOAuthUseCase.execute).not.toHaveBeenCalled();
    expect(processIncomingMessageUseCase.execute).toHaveBeenCalledTimes(1);
    expect(result.reply).toBe('respuesta ia');
  });
});
