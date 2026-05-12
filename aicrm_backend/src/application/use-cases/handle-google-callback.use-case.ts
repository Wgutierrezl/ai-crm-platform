import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { OauthIdentity } from '../../domain/entities/oauth-identity.entity';
import { OauthRegistrationSession } from '../../domain/entities/oauth-registration-session.entity';
import { User } from '../../domain/entities/user.entity';
import { GoogleOidcProviderPort } from '../../domain/ports/google-oidc-provider.port';
import { OauthIdentityRepository } from '../../domain/ports/oauth-identity.repository.port';
import { OauthRegistrationSessionRepository } from '../../domain/ports/oauth-registration-session.repository.port';
import { OauthTempStorePort } from '../../domain/ports/oauth-temp-store.port';
import { UserRepository } from '../../domain/ports/user.repository.port';

export interface HandleGoogleCallbackInput {
  code: string;
  state: string;
}

export interface HandleGoogleCallbackOutput {
  redirectUrl: string;
}

@Injectable()
export class HandleGoogleCallbackUseCase {
  private readonly logger = new Logger(HandleGoogleCallbackUseCase.name);
  constructor(
    private readonly oidcProvider: GoogleOidcProviderPort,
    private readonly oauthTempStore: OauthTempStorePort,
    private readonly oauthIdentityRepository: OauthIdentityRepository,
    private readonly oauthRegistrationSessionRepository: OauthRegistrationSessionRepository,
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: HandleGoogleCallbackInput): Promise<HandleGoogleCallbackOutput> {
    this.logger.log(
      `[GoogleOAuth][Users][Callback] processing hasCode=${Boolean(input.code)} hasState=${Boolean(input.state)} code=${this.maskValue(input.code)} state=${this.maskValue(input.state)}`,
    );
    const statePayload = await this.oauthTempStore.consumeState(input.state);
    this.logger.log(
      `[GoogleOAuth][Users][Callback] state validation result valid=${Boolean(statePayload)}`,
    );
    if (!statePayload) {
      throw new UnauthorizedException('State OAuth invalido o expirado.');
    }
    const callbackUrl = this.resolveUsersCallbackUrl();
    this.logger.log(
      `[GoogleOAuth][Users][Callback] callbackUrl=${this.maskCallbackUrl(callbackUrl)}`,
    );
    const profile = await this.oidcProvider.exchangeCodeForProfile({
      code: input.code,
      callbackUrl,
    });
    this.logger.log(
      `[GoogleOAuth][Users][Callback] google exchange done email=${this.maskValue(profile.email)} emailVerified=${profile.emailVerified} sub=${this.maskValue(profile.providerUserId)}`,
    );
    if (!profile.emailVerified) {
      throw new UnauthorizedException('Google reporta email no verificado.');
    }

    const existingIdentity = await this.oauthIdentityRepository.findByProviderUserId(
      'google',
      profile.providerUserId,
    );
    this.logger.log(
      `[GoogleOAuth][Users][Callback] oauth identity exists=${Boolean(existingIdentity)}`,
    );
    let user: User | null = null;

    if (existingIdentity) {
      user = await this.userRepository.findById(existingIdentity.userId);
      if (!user) {
        throw new ConflictException('La identidad OAuth esta vinculada a un usuario inexistente.');
      }
    } else {
      user = await this.userRepository.findByEmail(profile.email);
      this.logger.log(
        `[GoogleOAuth][Users][Callback] user by email exists=${Boolean(user)} email=${this.maskValue(profile.email)}`,
      );
      if (!user) {
        const ttl = Number(this.configService.get<string>('OAUTH_STATE_TTL_MINUTES', '10'));
        const now = new Date();
        const session = await this.oauthRegistrationSessionRepository.create(
          new OauthRegistrationSession(
            uuidv4(),
            'google',
            profile.providerUserId,
            profile.email,
            profile.emailVerified,
            profile.fullName,
            profile.pictureUrl,
            'pending',
            new Date(now.getTime() + Math.max(1, ttl) * 60_000),
            null,
            now,
            now,
          ),
        );
        const authCode = await this.oauthTempStore.issueAuthCode(
          {
            kind: 'registration_required',
            email: profile.email,
            registrationSessionId: session.id,
          },
          Math.max(1, Math.min(ttl, 5)),
        );
        const successBase = this.required('GOOGLE_OAUTH_SUCCESS_REDIRECT_URL');
        const redirectUrl = `${successBase}${successBase.includes('?') ? '&' : '?'}code=${encodeURIComponent(authCode)}`;
        this.logger.log(
          `[GoogleOAuth][Users][Callback] registration required sessionId=${this.maskValue(session.id)} redirect=${this.maskUrl(redirectUrl)}`,
        );
        return { redirectUrl };
      }

      const alreadyLinkedUser = await this.oauthIdentityRepository.findByProviderAndUserId(
        'google',
        user.id,
      );
      if (alreadyLinkedUser && alreadyLinkedUser.providerUserId !== profile.providerUserId) {
        throw new ConflictException('El usuario ya esta vinculado a otra identidad Google.');
      }

      if (!alreadyLinkedUser) {
        await this.oauthIdentityRepository.create(
          new OauthIdentity(
            uuidv4(),
            'google',
            profile.providerUserId,
            user.id,
            profile.email,
            profile.emailVerified,
            profile.fullName,
            profile.pictureUrl,
            new Date(),
            new Date(),
            new Date(),
          ),
        );
        this.logger.log(
          `[GoogleOAuth][Users][Callback] oauth identity linked userId=${this.maskValue(user.id)} sub=${this.maskValue(profile.providerUserId)}`,
        );
      }
    }

    const ttl = Number(this.configService.get<string>('OAUTH_STATE_TTL_MINUTES', '10'));
    const authCode = await this.oauthTempStore.issueAuthCode(
      {
        kind: 'authenticated',
        userId: user.id,
        companyId: user.companyId,
        email: user.email,
        role: user.role,
      },
      Math.max(1, Math.min(ttl, 5)),
    );
    this.logger.log(
      `[GoogleOAuth][Users][Callback] auth code issued code=${this.maskValue(authCode)} userId=${this.maskValue(user.id)}`,
    );
    const successBase = this.required('GOOGLE_OAUTH_SUCCESS_REDIRECT_URL');
    const redirectUrl = `${successBase}${successBase.includes('?') ? '&' : '?'}code=${encodeURIComponent(authCode)}`;
    this.logger.log(
      `[GoogleOAuth][Users][Callback] final redirect prepared redirect=${this.maskUrl(redirectUrl)}`,
    );
    return { redirectUrl };
  }

  private required(key: string): string {
    const value = this.configService.get<string>(key, '').trim();
    if (!value) throw new BadRequestException(`Falta configuracion ${key}`);
    return value;
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

  private maskValue(value: string | null | undefined): string {
    const input = String(value ?? '').trim();
    if (!input) return 'empty';
    if (input.length <= 8) return `${input.slice(0, 2)}***${input.slice(-1)}`;
    return `${input.slice(0, 4)}...${input.slice(-4)}`;
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const code = parsed.searchParams.get('code');
      if (code) parsed.searchParams.set('code', this.maskValue(code));
      return parsed.toString();
    } catch {
      return this.maskValue(url);
    }
  }
}
