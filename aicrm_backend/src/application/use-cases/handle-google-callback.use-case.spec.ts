import { HandleGoogleCallbackUseCase } from './handle-google-callback.use-case';

describe('HandleGoogleCallbackUseCase', () => {
  it('links existing user by verified email and returns redirect with auth code', async () => {
    const oidcProvider = {
      exchangeCodeForProfile: jest.fn().mockResolvedValue({
        providerUserId: 'google-sub-1',
        email: 'ana@example.com',
        emailVerified: true,
        givenName: 'Ana',
        familyName: 'Diaz',
        fullName: 'Ana Diaz',
        pictureUrl: null,
      }),
    };
    const oauthTempStore = {
      consumeState: jest.fn().mockResolvedValue({ nonce: 'n1' }),
      issueAuthCode: jest.fn().mockResolvedValue('authcode_1'),
    };
    const oauthIdentityRepository = {
      findByProviderUserId: jest.fn().mockResolvedValue(null),
      findByProviderAndUserId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(undefined),
    };
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue({
        id: 'u1',
        email: 'ana@example.com',
        companyId: 'c1',
        role: 'admin',
      }),
      findById: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
    };
    const companyRepository = {
      create: jest.fn(),
    };
    const configService = {
      get: jest.fn((key: string, fallback?: string) => {
        if (key === 'GOOGLE_OAUTH_SUCCESS_REDIRECT_URL') return 'http://localhost:5173/login/google/callback';
        if (key === 'OAUTH_STATE_TTL_MINUTES') return '10';
        return fallback ?? '';
      }),
    };

    const useCase = new HandleGoogleCallbackUseCase(
      oidcProvider as any,
      oauthTempStore as any,
      oauthIdentityRepository as any,
      userRepository as any,
      companyRepository as any,
      configService as any,
    );

    const result = await useCase.execute({ code: 'code-ok', state: 'state-ok' });
    expect(result.redirectUrl).toContain('code=authcode_1');
    expect(oauthIdentityRepository.create).toHaveBeenCalledTimes(1);
  });
});
