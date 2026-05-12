import { ExchangeGoogleAuthCodeUseCase } from './exchange-google-auth-code.use-case';

describe('ExchangeGoogleAuthCodeUseCase', () => {
  it('exchanges valid auth code for jwt', async () => {
    const oauthTempStore = {
      consumeAuthCode: jest.fn().mockResolvedValue({
        kind: 'authenticated',
        userId: 'u1',
        companyId: 'c1',
        email: 'a@a.com',
        role: 'admin',
      }),
    };
    const userRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 'u1',
        companyId: 'c1',
        email: 'a@a.com',
        role: 'admin',
      }),
    };
    const jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };
    const useCase = new ExchangeGoogleAuthCodeUseCase(
      oauthTempStore as any,
      userRepository as any,
      jwtService as any,
    );

    const result = await useCase.execute({ code: 'ok' });
    expect(result.status).toBe('authenticated');
    expect(result.accessToken).toBe('jwt-token');
    expect(result.userId).toBe('u1');
  });

  it('returns registration_required when auth code corresponds to pending registration', async () => {
    const oauthTempStore = {
      consumeAuthCode: jest.fn().mockResolvedValue({
        kind: 'registration_required',
        email: 'new@example.com',
        registrationSessionId: 'reg-session-1',
      }),
    };
    const userRepository = {
      findById: jest.fn(),
    };
    const jwtService = {
      sign: jest.fn(),
    };
    const useCase = new ExchangeGoogleAuthCodeUseCase(
      oauthTempStore as any,
      userRepository as any,
      jwtService as any,
    );

    const result = await useCase.execute({ code: 'ok' });
    expect(result.status).toBe('registration_required');
    expect(result.registrationToken).toBe('reg-session-1');
    expect(result.email).toBe('new@example.com');
    expect(userRepository.findById).not.toHaveBeenCalled();
  });
});
