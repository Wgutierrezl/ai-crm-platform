import { StartCustomerGoogleOAuthUseCase } from './start-customer-google-oauth.use-case';

describe('StartCustomerGoogleOAuthUseCase', () => {
  it('creates pending session and returns authorization url', async () => {
    const customerRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'cust-1', companyId: 'comp-1' }),
    };
    const conversationRepository = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'conv-1', companyId: 'comp-1', customerId: 'cust-1' }),
    };
    const customerOauthLinkSessionRepository = {
      create: jest.fn().mockImplementation(async (session) => session),
    };
    const oidcProvider = {
      buildAuthorizationUrl: jest.fn().mockReturnValue('https://accounts.google.com/mock'),
    };
    const configService = {
      get: jest
        .fn()
        .mockImplementation((key: string, fallback: string) =>
          key === 'GOOGLE_CUSTOMER_OAUTH_CALLBACK_URL'
            ? 'https://api.local/api/v1/customers/oauth/google/callback'
            : fallback,
        ),
    };

    const useCase = new StartCustomerGoogleOAuthUseCase(
      customerRepository as any,
      conversationRepository as any,
      customerOauthLinkSessionRepository as any,
      oidcProvider as any,
      configService as any,
    );

    const result = await useCase.execute({
      companyId: 'comp-1',
      customerId: 'cust-1',
      conversationId: 'conv-1',
      channel: 'whatsapp',
      externalUserId: '573001112233',
    });

    expect(result.authorizationUrl).toContain('https://accounts.google.com');
    expect(customerOauthLinkSessionRepository.create).toHaveBeenCalledTimes(1);
    expect(oidcProvider.buildAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackUrl: 'https://api.local/api/v1/customers/oauth/google/callback',
      }),
    );
  });
});

