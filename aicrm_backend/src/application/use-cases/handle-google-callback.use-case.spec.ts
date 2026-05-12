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
    const oauthRegistrationSessionRepository = {
      create: jest.fn(),
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
      oauthRegistrationSessionRepository as any,
      userRepository as any,
      configService as any,
    );

    const result = await useCase.execute({ code: 'code-ok', state: 'state-ok' });
    expect(result.redirectUrl).toContain('code=authcode_1');
    expect(oauthIdentityRepository.create).toHaveBeenCalledTimes(1);
  });

  it('returns registration required redirect when google user is new', async () => {
    const oidcProvider = {
      exchangeCodeForProfile: jest.fn().mockResolvedValue({
        providerUserId: 'google-sub-2',
        email: 'new@example.com',
        emailVerified: true,
        givenName: 'New',
        familyName: 'User',
        fullName: 'New User',
        pictureUrl: null,
      }),
    };
    const oauthTempStore = {
      consumeState: jest.fn().mockResolvedValue({ nonce: 'n1' }),
      issueAuthCode: jest.fn().mockResolvedValue('authcode_reg_1'),
    };
    const oauthIdentityRepository = {
      findByProviderUserId: jest.fn().mockResolvedValue(null),
      findByProviderAndUserId: jest.fn(),
      create: jest.fn(),
    };
    const oauthRegistrationSessionRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'reg-session-1',
      }),
    };
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(null),
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
      oauthRegistrationSessionRepository as any,
      userRepository as any,
      configService as any,
    );

    const result = await useCase.execute({ code: 'code-ok', state: 'state-ok' });
    expect(result.redirectUrl).toContain('code=authcode_reg_1');
    expect(oauthRegistrationSessionRepository.create).toHaveBeenCalledTimes(1);
    expect(oauthIdentityRepository.create).toHaveBeenCalledTimes(0);
  });

  it('fails when google email is not verified', async () => {
    const oidcProvider = {
      exchangeCodeForProfile: jest.fn().mockResolvedValue({
        providerUserId: 'google-sub-3',
        email: 'unverified@example.com',
        emailVerified: false,
        givenName: 'No',
        familyName: 'Verify',
        fullName: 'No Verify',
        pictureUrl: null,
      }),
    };
    const oauthTempStore = {
      consumeState: jest.fn().mockResolvedValue({ nonce: 'n1' }),
      issueAuthCode: jest.fn(),
    };
    const oauthIdentityRepository = {
      findByProviderUserId: jest.fn(),
      findByProviderAndUserId: jest.fn(),
      create: jest.fn(),
    };
    const oauthRegistrationSessionRepository = {
      create: jest.fn(),
    };
    const userRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };
    const configService = {
      get: jest.fn((_: string, fallback?: string) => fallback ?? ''),
    };

    const useCase = new HandleGoogleCallbackUseCase(
      oidcProvider as any,
      oauthTempStore as any,
      oauthIdentityRepository as any,
      oauthRegistrationSessionRepository as any,
      userRepository as any,
      configService as any,
    );

    await expect(
      useCase.execute({ code: 'code-ok', state: 'state-ok' }),
    ).rejects.toThrow('Google reporta email no verificado');
  });
});
