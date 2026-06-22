import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { ConversationState } from '../../domain/entities/conversation-state.entity';
import { CustomerOauthIdentity } from '../../domain/entities/customer-oauth-identity.entity';
import { CustomerOauthLinkSession } from '../../domain/entities/customer-oauth-link-session.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { ConversationStateRepository } from '../../domain/ports/conversation-state.repository.port';
import { CustomerOauthIdentityRepository } from '../../domain/ports/customer-oauth-identity.repository.port';
import { CustomerOauthLinkSessionRepository } from '../../domain/ports/customer-oauth-link-session.repository.port';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { GoogleOidcProviderPort } from '../../domain/ports/google-oidc-provider.port';
import { TransactionalEmailService } from '../services/transactional-email.service';

export interface HandleCustomerGoogleOAuthCallbackInput {
  code: string;
  state: string;
}

export interface HandleCustomerGoogleOAuthCallbackOutput {
  success: boolean;
  message: string;
  companyId: string;
}

@Injectable()
export class HandleCustomerGoogleOAuthCallbackUseCase {
  private readonly logger = new Logger(HandleCustomerGoogleOAuthCallbackUseCase.name);

  constructor(
    private readonly customerOauthLinkSessionRepository: CustomerOauthLinkSessionRepository,
    private readonly customerOauthIdentityRepository: CustomerOauthIdentityRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly conversationStateRepository: ConversationStateRepository,
    private readonly oidcProvider: GoogleOidcProviderPort,
    private readonly configService: ConfigService,
    private readonly transactionalEmailService: TransactionalEmailService,
  ) {}

  async execute(
    input: HandleCustomerGoogleOAuthCallbackInput,
  ): Promise<HandleCustomerGoogleOAuthCallbackOutput> {
    if (!input.code?.trim() || !input.state?.trim()) {
      throw new BadRequestException('code/state son obligatorios.');
    }

    const session = await this.customerOauthLinkSessionRepository.findByStateToken(
      input.state.trim(),
    );
    if (!session) {
      throw new UnauthorizedException('State invalido.');
    }
    if (session.status !== 'pending' || session.consumedAt) {
      throw new UnauthorizedException('State ya consumido.');
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      await this.markSession(session, 'consumed', 'expired');
      throw new UnauthorizedException('State expirado.');
    }

    const callbackUrl = this.resolveCustomersCallbackUrl();
    this.logger.log(
      `[CustomerGoogleOAuth][Callback] callbackUrl=${this.maskCallbackUrl(callbackUrl)}`,
    );
    const profile = await this.oidcProvider.exchangeCodeForProfile({
      code: input.code.trim(),
      callbackUrl: callbackUrl ?? undefined,
    });
    if (!profile.emailVerified) {
      await this.markSession(session, 'consumed', 'failed');
      throw new UnauthorizedException('Google reporta email no verificado.');
    }

    const customer = await this.customerRepository.findById(session.customerId);
    if (!customer || customer.companyId !== session.companyId) {
      await this.markSession(session, 'consumed', 'failed');
      throw new UnauthorizedException('Customer de la sesion no es valido.');
    }

    const byProviderUser =
      await this.customerOauthIdentityRepository.findByCompanyProviderUserId(
        session.companyId,
        'google',
        profile.providerUserId,
      );
    const byCustomer =
      await this.customerOauthIdentityRepository.findByCompanyProviderCustomerId(
        session.companyId,
        'google',
        session.customerId,
      );
    const existingIdentity = byProviderUser ?? byCustomer;
    const now = new Date();

    if (existingIdentity && existingIdentity.customerId !== session.customerId) {
      await this.markSession(session, 'consumed', 'failed');
      throw new UnauthorizedException(
        'La identidad Google ya esta vinculada a otro customer.',
      );
    }

    if (existingIdentity) {
      await this.customerOauthIdentityRepository.update(
        new CustomerOauthIdentity(
          existingIdentity.id,
          existingIdentity.companyId,
          existingIdentity.customerId,
          existingIdentity.provider,
          existingIdentity.providerUserId,
          profile.email,
          profile.emailVerified,
          profile.fullName,
          profile.pictureUrl,
          now,
          existingIdentity.createdAt,
          now,
        ),
      );
    } else {
      await this.customerOauthIdentityRepository.create(
        new CustomerOauthIdentity(
          randomUUID(),
          session.companyId,
          session.customerId,
          'google',
          profile.providerUserId,
          profile.email,
          profile.emailVerified,
          profile.fullName,
          profile.pictureUrl,
          now,
          now,
          now,
        ),
      );
    }

    const mergedCustomer = this.mergeCustomer(customer, profile, now);
    await this.customerRepository.update(mergedCustomer);
    await this.advanceOnboardingStateIfExists(session, mergedCustomer);
    if (mergedCustomer.onboardingCompleted) {
      await this.transactionalEmailService.sendWelcomeOnOnboardingCompleted({
        companyId: session.companyId,
        customer: mergedCustomer,
        source: 'google_oauth',
      });
    }
    await this.markSession(session, 'consumed', 'success');

    this.logger.log(
      `[CustomerGoogleOAuth][Callback] success customerId=${session.customerId} companyId=${session.companyId}`,
    );
    return {
      success: true,
      message: 'Google vinculado correctamente. Puedes volver a WhatsApp.',
      companyId: session.companyId,
    };
  }

  private mergeCustomer(
    customer: Customer,
    profile: {
      email: string;
      fullName: string | null;
      givenName: string | null;
      pictureUrl: string | null;
    },
    now: Date,
  ): Customer {
    const metadata = {
      ...(customer.metadata ?? {}),
      googlePictureUrl: profile.pictureUrl ?? (customer.metadata?.['googlePictureUrl'] as string | undefined) ?? null,
      googleLinkedAt: now.toISOString(),
    };
    const fullName = customer.fullName?.trim() || profile.fullName?.trim() || null;
    const firstName = customer.firstName?.trim() || profile.givenName?.trim() || null;
    const hasName = Boolean(firstName) || Boolean(fullName);
    const hasEmail = Boolean((customer.email ?? profile.email)?.trim());
    const onboardingCompleted = hasName && hasEmail;
    return new Customer(
      customer.id,
      customer.name ?? fullName,
      customer.phone,
      customer.email ?? profile.email,
      customer.companyId,
      customer.identificationType,
      customer.identificationNumber,
      firstName,
      customer.lastName,
      fullName,
      customer.address,
      customer.city,
      customer.age,
      metadata,
      onboardingCompleted,
      onboardingCompleted ? 'COMPLETED' : hasName ? 'WAITING_EMAIL' : 'WAITING_NAME',
      onboardingCompleted ? 100 : hasName ? 50 : 20,
    );
  }

  private async advanceOnboardingStateIfExists(
    session: CustomerOauthLinkSession,
    customerAfter: Customer,
  ): Promise<void> {
    const state = await this.conversationStateRepository.findByConversationId(
      session.conversationId,
    );
    if (!state) return;

    const hasName =
      Boolean(customerAfter.firstName?.trim()) || Boolean(customerAfter.fullName?.trim());
    const hasEmail = Boolean(customerAfter.email?.trim());
    const nextStep = hasName && hasEmail ? 'COMPLETED' : hasName ? 'WAITING_EMAIL' : 'WAITING_NAME';
    const completed = nextStep === 'COMPLETED';
    await this.conversationStateRepository.update(
      new ConversationState(
        state.id,
        state.conversationId,
        state.companyId,
        state.status,
        nextStep,
        {
          ...(state.context ?? {}),
          oauthGoogleLinked: true,
          oauthGoogleLinkedAt: new Date().toISOString(),
          missingFields: completed ? [] : nextStep === 'WAITING_EMAIL' ? ['email'] : ['firstName', 'email'],
        },
        state.createdAt,
        new Date(),
      ),
    );
  }

  private async markSession(
    session: CustomerOauthLinkSession,
    status: 'pending' | 'consumed',
    resultStatus: 'success' | 'cancelled' | 'failed' | 'expired' | null,
  ): Promise<void> {
    await this.customerOauthLinkSessionRepository.update(
      new CustomerOauthLinkSession(
        session.id,
        session.companyId,
        session.customerId,
        session.conversationId,
        session.channel,
        session.externalUserId,
        session.provider,
        session.stateToken,
        status,
        session.expiresAt,
        status === 'consumed' ? new Date() : session.consumedAt,
        resultStatus,
        session.createdAt,
        new Date(),
      ),
    );
  }

  private resolveCustomersCallbackUrl(): string | null {
    const explicit = this.configService
      .get<string>('GOOGLE_OAUTH_CUSTOMERS_WHATSAPP_CALLBACK_URL', '')
      .trim();
    if (explicit) return explicit;
    const legacy = this.configService
      .get<string>('GOOGLE_CUSTOMER_OAUTH_CALLBACK_URL', '')
      .trim();
    return legacy || null;
  }

  private maskCallbackUrl(value: string | null): string {
    if (!value) return 'default_adapter_callback';
    try {
      const parsed = new URL(value);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return value.slice(0, 32);
    }
  }
}
