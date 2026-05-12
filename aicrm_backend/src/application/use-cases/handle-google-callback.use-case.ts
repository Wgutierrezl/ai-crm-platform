import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Company } from '../../domain/entities/company.entity';
import { OauthIdentity } from '../../domain/entities/oauth-identity.entity';
import { User } from '../../domain/entities/user.entity';
import { CompanyRepository } from '../../domain/ports/company.repository.port';
import { GoogleOidcProviderPort } from '../../domain/ports/google-oidc-provider.port';
import { OauthIdentityRepository } from '../../domain/ports/oauth-identity.repository.port';
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
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: HandleGoogleCallbackInput): Promise<HandleGoogleCallbackOutput> {
    this.logger.log(
      `[GoogleOAuth][Callback] processing hasCode=${Boolean(input.code)} hasState=${Boolean(input.state)} code=${this.maskValue(input.code)} state=${this.maskValue(input.state)}`,
    );
    const statePayload = await this.oauthTempStore.consumeState(input.state);
    this.logger.log(
      `[GoogleOAuth][Callback] state validation result valid=${Boolean(statePayload)}`,
    );
    if (!statePayload) {
      throw new UnauthorizedException('State OAuth invalido o expirado.');
    }
    const profile = await this.oidcProvider.exchangeCodeForProfile({
      code: input.code,
    });
    this.logger.log(
      `[GoogleOAuth][Callback] google exchange done email=${this.maskValue(profile.email)} emailVerified=${profile.emailVerified} sub=${this.maskValue(profile.providerUserId)}`,
    );
    if (!profile.emailVerified) {
      throw new UnauthorizedException('Google reporta email no verificado.');
    }

    const existingIdentity = await this.oauthIdentityRepository.findByProviderUserId(
      'google',
      profile.providerUserId,
    );
    this.logger.log(
      `[GoogleOAuth][Callback] oauth identity exists=${Boolean(existingIdentity)}`,
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
        `[GoogleOAuth][Callback] user by email exists=${Boolean(user)} email=${this.maskValue(profile.email)}`,
      );
      if (!user) {
        const companyId = uuidv4();
        const company = new Company(
          companyId,
          this.inferCompanyName(profile.email, profile.fullName),
          new Date(),
        );
        await this.companyRepository.create(company);
        this.logger.log(
          `[GoogleOAuth][Callback] created company for new user companyId=${this.maskValue(companyId)}`,
        );

        user = await this.userRepository.create(
          new User(
            uuidv4(),
            profile.email,
            this.buildOAuthPlaceholderPasswordHash(),
            'GOOGLE',
            `GOOGLE-${profile.providerUserId.slice(0, 32)}`,
            'admin',
            companyId,
            new Date(),
            profile.fullName ?? undefined,
          ),
        );
        this.logger.log(
          `[GoogleOAuth][Callback] created new user userId=${this.maskValue(user.id)}`,
        );
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
          `[GoogleOAuth][Callback] oauth identity linked userId=${this.maskValue(user.id)} sub=${this.maskValue(profile.providerUserId)}`,
        );
      }
    }

    const ttl = Number(this.configService.get<string>('OAUTH_STATE_TTL_MINUTES', '10'));
    const authCode = await this.oauthTempStore.issueAuthCode(
      {
        userId: user.id,
        companyId: user.companyId,
        email: user.email,
        role: user.role,
      },
      Math.max(1, Math.min(ttl, 5)),
    );
    this.logger.log(
      `[GoogleOAuth][Callback] auth code issued code=${this.maskValue(authCode)} userId=${this.maskValue(user.id)}`,
    );
    const successBase = this.required('GOOGLE_OAUTH_SUCCESS_REDIRECT_URL');
    const redirectUrl = `${successBase}${successBase.includes('?') ? '&' : '?'}code=${encodeURIComponent(authCode)}`;
    this.logger.log(
      `[GoogleOAuth][Callback] final redirect prepared redirect=${this.maskUrl(redirectUrl)}`,
    );
    return { redirectUrl };
  }

  private required(key: string): string {
    const value = this.configService.get<string>(key, '').trim();
    if (!value) throw new BadRequestException(`Falta configuracion ${key}`);
    return value;
  }

  private inferCompanyName(email: string, fullName: string | null): string {
    if (fullName?.trim()) return `${fullName.trim()} - Empresa`;
    const [local] = email.split('@');
    return `${local || 'Nueva'} - Empresa`;
  }

  private buildOAuthPlaceholderPasswordHash(): string {
    return bcrypt.hashSync(`oauth_google_${uuidv4().replace(/-/g, '')}`, 10);
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
