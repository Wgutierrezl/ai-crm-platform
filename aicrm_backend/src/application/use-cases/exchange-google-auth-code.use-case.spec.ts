import { ExchangeGoogleAuthCodeUseCase } from './exchange-google-auth-code.use-case';

describe('ExchangeGoogleAuthCodeUseCase', () => {
  it('exchanges valid auth code for jwt', async () => {
    const oauthTempStore = {
      consumeAuthCode: jest.fn().mockResolvedValue({
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
    expect(result.accessToken).toBe('jwt-token');
    expect(result.userId).toBe('u1');
  });
});
