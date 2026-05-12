import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { CustomerOauthLinkSession } from '../../domain/entities/customer-oauth-link-session.entity';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { CustomerOauthLinkSessionRepository } from '../../domain/ports/customer-oauth-link-session.repository.port';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { GoogleOidcProviderPort } from '../../domain/ports/google-oidc-provider.port';

export interface StartCustomerGoogleOAuthInput {
  companyId: string;
  customerId: string;
  conversationId: string;
  channel: 'whatsapp';
  externalUserId: string;
}

export interface StartCustomerGoogleOAuthOutput {
  authorizationUrl: string;
  expiresAt: Date;
}

@Injectable()
export class StartCustomerGoogleOAuthUseCase {
  private readonly logger = new Logger(StartCustomerGoogleOAuthUseCase.name);

  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly customerOauthLinkSessionRepository: CustomerOauthLinkSessionRepository,
    private readonly oidcProvider: GoogleOidcProviderPort,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    input: StartCustomerGoogleOAuthInput,
  ): Promise<StartCustomerGoogleOAuthOutput> {
    if (input.channel !== 'whatsapp') {
      throw new BadRequestException('Canal no soportado para OAuth customer.');
    }

    const customer = await this.customerRepository.findById(input.customerId);
    if (!customer || customer.companyId !== input.companyId) {
      throw new NotFoundException('Customer no encontrado para companyId.');
    }

    const conversation = await this.conversationRepository.findById(
      input.conversationId,
    );
    if (
      !conversation ||
      conversation.companyId !== input.companyId ||
      conversation.customerId !== input.customerId
    ) {
      throw new UnauthorizedException('Conversacion invalida para customer/company.');
    }

    const ttlMinutes = Math.max(
      1,
      Number(this.configService.get<string>('CUSTOMER_OAUTH_STATE_TTL_MINUTES', '10')),
    );
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);
    const stateToken = randomUUID();

    await this.customerOauthLinkSessionRepository.create(
      new CustomerOauthLinkSession(
        randomUUID(),
        input.companyId,
        input.customerId,
        input.conversationId,
        input.channel,
        input.externalUserId,
        'google',
        stateToken,
        'pending',
        expiresAt,
        null,
        null,
        now,
        now,
      ),
    );

    const callbackUrl = this.resolveCustomersCallbackUrl();
    this.logger.log(
      `[CustomerGoogleOAuth][Start] callbackUrl=${this.maskCallbackUrl(callbackUrl)}`,
    );
    const authorizationUrl = this.oidcProvider.buildAuthorizationUrl({
      state: stateToken,
      scopes: ['openid', 'email', 'profile'],
      callbackUrl: callbackUrl ?? undefined,
    });

    return {
      authorizationUrl,
      expiresAt,
    };
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
