import { CompleteGoogleRegistrationUseCase } from './complete-google-registration.use-case';

describe('CompleteGoogleRegistrationUseCase', () => {
  const baseSession = {
    id: 'reg-session-1',
    provider: 'google',
    providerUserId: 'sub-123',
    email: 'new@example.com',
    emailVerified: true,
    fullName: 'New User',
    pictureUrl: null,
    status: 'pending',
    expiresAt: new Date(Date.now() + 60_000),
    consumedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const makeDataSource = (opts?: { failOnIdentity?: boolean }) => {
    const manager = {
      create: jest.fn((_: unknown, payload: unknown) => payload),
      save: jest.fn(async (entity: unknown, payload: any) => {
        if (opts?.failOnIdentity && String(entity).includes('OauthIdentityOrmEntity')) {
          throw new Error('identity_save_failed');
        }
        return payload;
      }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    return {
      manager,
      transaction: jest.fn(async (cb: (mgr: typeof manager) => Promise<void>) => cb(manager)),
    };
  };

  it('creates company + user + oauth identity, consumes session and returns jwt', async () => {
    const oauthRegistrationSessionRepository = {
      findById: jest.fn().mockResolvedValue(baseSession),
    };
    const oauthIdentityRepository = {
      findByProviderUserId: jest.fn().mockResolvedValue(null),
    };
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
    };
    const dataSource = makeDataSource();
    const jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };
    const useCase = new CompleteGoogleRegistrationUseCase(
      oauthRegistrationSessionRepository as any,
      oauthIdentityRepository as any,
      userRepository as any,
      dataSource as any,
      jwtService as any,
    );

    const result = await useCase.execute({
      registrationToken: 'reg-session-1',
      companyName: 'ACME S.A.S',
      identificationType: 'NIT',
      identificationNumber: '901234567',
    });

    expect(result.accessToken).toBe('jwt-token');
    expect(result.role).toBe('admin');
    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(dataSource.manager.save).toHaveBeenCalledTimes(3);
    expect(dataSource.manager.update).toHaveBeenCalledTimes(1);

    const savedUserPayload = dataSource.manager.save.mock.calls[1][1];
    expect(savedUserPayload.identificationType).toBe('NIT');
    expect(savedUserPayload.identificationNumber).toBe('901234567');
    expect(savedUserPayload.identificationType).not.toBe('GOOGLE');
    expect(String(savedUserPayload.identificationNumber)).not.toContain('GOOGLE-');

    const savedOauthIdentityPayload = dataSource.manager.save.mock.calls[2][1];
    expect(savedOauthIdentityPayload.provider).toBe('google');
    expect(savedOauthIdentityPayload.providerUserId).toBe('sub-123');
  });

  it('rejects token reuse when session is already consumed', async () => {
    const oauthRegistrationSessionRepository = {
      findById: jest.fn().mockResolvedValue({
        ...baseSession,
        status: 'consumed',
        consumedAt: new Date(),
      }),
    };
    const useCase = new CompleteGoogleRegistrationUseCase(
      oauthRegistrationSessionRepository as any,
      {} as any,
      {} as any,
      makeDataSource() as any,
      {} as any,
    );

    await expect(
      useCase.execute({
        registrationToken: 'reg-session-1',
        companyName: 'ACME',
        identificationType: 'CC',
        identificationNumber: '123',
      }),
    ).rejects.toThrow('Token de registro ya fue consumido');
  });

  it('fails when token is expired', async () => {
    const oauthRegistrationSessionRepository = {
      findById: jest.fn().mockResolvedValue({
        ...baseSession,
        expiresAt: new Date(Date.now() - 5_000),
      }),
    };
    const useCase = new CompleteGoogleRegistrationUseCase(
      oauthRegistrationSessionRepository as any,
      {} as any,
      {} as any,
      makeDataSource() as any,
      {} as any,
    );

    await expect(
      useCase.execute({
        registrationToken: 'reg-session-1',
        companyName: 'ACME',
        identificationType: 'CC',
        identificationNumber: '123',
      }),
    ).rejects.toThrow('Token de registro expirado');
  });

  it('fails when email is not verified', async () => {
    const oauthRegistrationSessionRepository = {
      findById: jest.fn().mockResolvedValue({
        ...baseSession,
        emailVerified: false,
      }),
    };
    const useCase = new CompleteGoogleRegistrationUseCase(
      oauthRegistrationSessionRepository as any,
      {} as any,
      {} as any,
      makeDataSource() as any,
      {} as any,
    );

    await expect(
      useCase.execute({
        registrationToken: 'reg-session-1',
        companyName: 'ACME',
        identificationType: 'CC',
        identificationNumber: '123',
      }),
    ).rejects.toThrow('Google reporta email no verificado');
  });

  it('does not leave partial commits when oauth identity save fails (transaction rollback)', async () => {
    const oauthRegistrationSessionRepository = {
      findById: jest.fn().mockResolvedValue(baseSession),
    };
    const oauthIdentityRepository = {
      findByProviderUserId: jest.fn().mockResolvedValue(null),
    };
    const userRepository = {
      findByEmail: jest.fn().mockResolvedValue(null),
    };
    const dataSource = makeDataSource({ failOnIdentity: true });
    const useCase = new CompleteGoogleRegistrationUseCase(
      oauthRegistrationSessionRepository as any,
      oauthIdentityRepository as any,
      userRepository as any,
      dataSource as any,
      {} as any,
    );

    await expect(
      useCase.execute({
        registrationToken: 'reg-session-1',
        companyName: 'ACME S.A.S',
        identificationType: 'CC',
        identificationNumber: '112233',
      }),
    ).rejects.toThrow('identity_save_failed');

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(dataSource.manager.update).not.toHaveBeenCalled();
  });
});

