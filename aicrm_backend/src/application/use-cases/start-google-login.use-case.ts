import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { GoogleOidcProviderPort } from '../../domain/ports/google-oidc-provider.port';
import { OauthTempStorePort } from '../../domain/ports/oauth-temp-store.port';

export interface StartGoogleLoginOutput {
  authorizationUrl: string;
}

@Injectable()
export class StartGoogleLoginUseCase {
  private readonly logger = new Logger(StartGoogleLoginUseCase.name);
  constructor(
    private readonly oidcProvider: GoogleOidcProviderPort,
    private readonly oauthTempStore: OauthTempStorePort,
    private readonly configService: ConfigService,
  ) {}

  async execute(): Promise<StartGoogleLoginOutput> {
    const ttl = Number(this.configService.get<string>('OAUTH_STATE_TTL_MINUTES', '10'));
    this.logger.log(`[GoogleOAuth][Users][Start] issuing state ttlMinutes=${ttl}`);
    const state = await this.oauthTempStore.issueState(
      {
        nonce: randomUUID(),
      },
      ttl,
    );
    this.logger.log(`[GoogleOAuth][Users][Start] state issued state=${this.maskValue(state)}`);
    const callbackUrl = this.resolveUsersCallbackUrl();
    this.logger.log(
      `[GoogleOAuth][Users][Start] callbackUrl=${this.maskCallbackUrl(callbackUrl)}`,
    );
    const authorizationUrl = this.oidcProvider.buildAuthorizationUrl({
      state,
      scopes: ['openid', 'email', 'profile'],
      callbackUrl,
    });
    this.logger.log(`[GoogleOAuth][Users][Start] authorization url built`);
    return { authorizationUrl };
  }

  private resolveUsersCallbackUrl(): string | undefined {
    const explicit = this.configService
      .get<string>('GOOGLE_OAUTH_USERS_CALLBACK_URL', '')
      .trim();
    if (explicit) return explicit;
    const legacy = this.configService.get<string>('GOOGLE_OAUTH_CALLBACK_URL', '').trim();
    return legacy || undefined;
  }

  private maskCallbackUrl(value: string | undefined): string {
    if (!value) return 'default_adapter_callback';
    try {
      const parsed = new URL(value);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return this.maskValue(value);
    }
  }

  private maskValue(value: string): string {
    if (!value) return 'empty';
    if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-1)}`;
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
}
