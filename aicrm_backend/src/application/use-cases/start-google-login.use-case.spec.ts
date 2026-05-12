import { StartGoogleLoginUseCase } from './start-google-login.use-case';

describe('StartGoogleLoginUseCase', () => {
  it('builds google authorization url with state', async () => {
    const oidcProvider = {
      buildAuthorizationUrl: jest.fn().mockReturnValue('https://accounts.google.com/mock'),
    };
    const oauthTempStore = {
      issueState: jest.fn().mockResolvedValue('state_123'),
    };
    const configService = {
      get: jest.fn().mockReturnValue('10'),
    };

    const useCase = new StartGoogleLoginUseCase(
      oidcProvider as any,
      oauthTempStore as any,
      configService as any,
    );
    const result = await useCase.execute();

    expect(result.authorizationUrl).toContain('https://accounts.google.com');
    expect(oauthTempStore.issueState).toHaveBeenCalledTimes(1);
  });
});
