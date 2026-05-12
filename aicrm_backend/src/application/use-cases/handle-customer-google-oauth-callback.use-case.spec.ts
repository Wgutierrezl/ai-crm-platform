import { UnauthorizedException } from '@nestjs/common';
import { CustomerOauthLinkSession } from '../../domain/entities/customer-oauth-link-session.entity';
import { HandleCustomerGoogleOAuthCallbackUseCase } from './handle-customer-google-oauth-callback.use-case';

describe('HandleCustomerGoogleOAuthCallbackUseCase', () => {
  const baseSession = new CustomerOauthLinkSession(
    'session-1',
    'comp-1',
    'cust-1',
    'conv-1',
    'whatsapp',
    '573001112233',
    'google',
    'state-1',
    'pending',
    new Date(Date.now() + 60_000),
    null,
    null,
    new Date(),
    new Date(),
  );

  it('links google identity and updates customer on valid callback', async () => {
    const linkRepo = {
      findByStateToken: jest.fn().mockResolvedValue(baseSession),
      update: jest.fn().mockImplementation(async (s) => s),
    };
    const identityRepo = {
      findByCompanyProviderUserId: jest.fn().mockResolvedValue(null),
      findByCompanyProviderCustomerId: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(async (i) => i),
      update: jest.fn().mockImplementation(async (i) => i),
    };
    const customerRepo = {
      findById: jest.fn().mockResolvedValue({
        id: 'cust-1',
        companyId: 'comp-1',
        name: null,
        phone: '573001112233',
        email: null,
        identificationType: null,
        identificationNumber: null,
        firstName: null,
        lastName: null,
        fullName: null,
        address: null,
        city: null,
        age: null,
        metadata: null,
        onboardingCompleted: false,
        onboardingStep: 'WAITING_NAME',
        profileCompletionPercentage: 20,
      }),
      update: jest.fn().mockImplementation(async (c) => c),
    };
    const stateRepo = {
      findByConversationId: jest.fn().mockResolvedValue({
        id: 'state-1',
        conversationId: 'conv-1',
        companyId: 'comp-1',
        status: 'active',
        registrationStep: 'WAITING_NAME',
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: jest.fn().mockImplementation(async (s) => s),
    };
    const oidcProvider = {
      exchangeCodeForProfile: jest.fn().mockResolvedValue({
        providerUserId: 'google-sub-1',
        email: 'customer@gmail.com',
        emailVerified: true,
        givenName: 'Ana',
        familyName: null,
        fullName: 'Ana Diaz',
        pictureUrl: 'https://img',
      }),
    };
    const configService = { get: jest.fn().mockReturnValue('') };

    const useCase = new HandleCustomerGoogleOAuthCallbackUseCase(
      linkRepo as any,
      identityRepo as any,
      customerRepo as any,
      stateRepo as any,
      oidcProvider as any,
      configService as any,
      { sendWelcomeOnOnboardingCompleted: jest.fn().mockResolvedValue(undefined) } as any,
    );

    const result = await useCase.execute({ code: 'code-1', state: 'state-1' });

    expect(result.success).toBe(true);
    expect(identityRepo.create).toHaveBeenCalledTimes(1);
    expect(customerRepo.update).toHaveBeenCalledTimes(1);
    const savedCustomer = customerRepo.update.mock.calls[0][0];
    expect(savedCustomer.email).toBe('customer@gmail.com');
    expect(savedCustomer.fullName).toBe('Ana Diaz');
    expect(savedCustomer.onboardingCompleted).toBe(true);
    expect(savedCustomer.onboardingStep).toBe('COMPLETED');
    expect(savedCustomer.profileCompletionPercentage).toBe(100);
    const savedState = stateRepo.update.mock.calls[0][0];
    expect(savedState.registrationStep).toBe('COMPLETED');
    expect(savedState.context?.missingFields).toEqual([]);
    expect(linkRepo.update).toHaveBeenCalled();
  });

  it('fails when state is expired', async () => {
    const expiredSession = new CustomerOauthLinkSession(
      baseSession.id,
      baseSession.companyId,
      baseSession.customerId,
      baseSession.conversationId,
      baseSession.channel,
      baseSession.externalUserId,
      baseSession.provider,
      baseSession.stateToken,
      'pending',
      new Date(Date.now() - 60_000),
      null,
      null,
      baseSession.createdAt,
      baseSession.updatedAt,
    );
    const linkRepo = {
      findByStateToken: jest.fn().mockResolvedValue(expiredSession),
      update: jest.fn().mockResolvedValue(expiredSession),
    };

    const useCase = new HandleCustomerGoogleOAuthCallbackUseCase(
      linkRepo as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn().mockReturnValue('') } as any,
      { sendWelcomeOnOnboardingCompleted: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(useCase.execute({ code: 'code-1', state: 'state-1' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
