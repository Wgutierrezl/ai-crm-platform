import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../domain/ports/user.repository.port';
import { OauthTempStorePort } from '../../domain/ports/oauth-temp-store.port';

export interface ExchangeGoogleAuthCodeInput {
  code: string;
  traceId?: string;
}

export interface ExchangeGoogleAuthCodeOutput {
  status: 'authenticated' | 'registration_required';
  accessToken?: string;
  userId?: string;
  companyId?: string;
  role?: string;
  registrationToken?: string;
  email?: string;
}

@Injectable()
export class ExchangeGoogleAuthCodeUseCase {
  private readonly logger = new Logger(ExchangeGoogleAuthCodeUseCase.name);
  constructor(
    private readonly oauthTempStore: OauthTempStorePort,
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    input: ExchangeGoogleAuthCodeInput,
  ): Promise<ExchangeGoogleAuthCodeOutput> {
    const traceId = input.traceId ?? 'no-trace';
    this.logger.log(
      `[GoogleOAuth][Exchange] traceId=${traceId} processing code=${this.maskValue(input.code)}`,
    );
    const codeStatus = this.inspectAuthCode(input.code);
    if (codeStatus) {
      this.logger.log(
        `[GoogleOAuth][Exchange] traceId=${traceId} pre-consume status exists=${codeStatus.exists} expired=${codeStatus.expired} consumed=${codeStatus.consumed} hasUserId=${codeStatus.hasUserId} hasPendingRegistration=${codeStatus.hasPendingRegistration} expiresAtEpochMs=${codeStatus.expiresAtEpochMs ?? 'null'}`,
      );
    }
    const payload = await this.oauthTempStore.consumeAuthCode(input.code);
    this.logger.log(
      `[GoogleOAuth][Exchange] traceId=${traceId} auth code lookup found=${Boolean(payload)} consumedAt=now`,
    );
    if (!payload) {
      this.logger.warn(
        `[GoogleOAuth][Exchange] traceId=${traceId} reject401 reason=code_invalid_or_expired_or_consumed code=${this.maskValue(input.code)}`,
      );
      throw new UnauthorizedException('Codigo OAuth invalido o expirado.');
    }

    if (payload.kind === 'registration_required') {
      if (!payload.registrationSessionId) {
        this.logger.warn(`[GoogleOAuth][Exchange] traceId=${traceId} reject401 reason=missing_registration_session_id`);
        throw new UnauthorizedException('Codigo OAuth de registro invalido.');
      }
      this.logger.log(
        `[GoogleOAuth][Exchange] traceId=${traceId} emit status=registration_required registrationToken=${this.maskValue(payload.registrationSessionId)} email=${this.maskValue(payload.email)}`,
      );
      return {
        status: 'registration_required',
        registrationToken: payload.registrationSessionId,
        email: payload.email,
      };
    }

    if (!payload.userId) {
      this.logger.warn(`[GoogleOAuth][Exchange] traceId=${traceId} reject401 reason=missing_user_id_payload`);
      throw new UnauthorizedException('Codigo OAuth invalido para autenticacion.');
    }

    const user = await this.userRepository.findById(payload.userId);
    this.logger.log(
      `[GoogleOAuth][Exchange] user lookup found=${Boolean(user)} userId=${this.maskValue(payload.userId)}`,
    );
    if (!user) {
      this.logger.warn(
        `[GoogleOAuth][Exchange] traceId=${traceId} reject401 reason=user_not_found userId=${this.maskValue(payload.userId)}`,
      );
      throw new UnauthorizedException('Usuario no encontrado para auth code.');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    });
    this.logger.log(
      `[GoogleOAuth][Exchange] traceId=${traceId} emit status=authenticated userId=${this.maskValue(user.id)} companyId=${this.maskValue(user.companyId)} jwt=${this.maskValue(accessToken)}`,
    );
    return {
      status: 'authenticated',
      accessToken,
      userId: user.id,
      companyId: user.companyId,
      role: user.role,
    };
  }

  private maskValue(value: string | null | undefined): string {
    const input = String(value ?? '').trim();
    if (!input) return 'empty';
    if (input.length <= 8) return `${input.slice(0, 2)}***${input.slice(-1)}`;
    return `${input.slice(0, 4)}...${input.slice(-4)}`;
  }

  private inspectAuthCode(code: string): {
    exists: boolean;
    expired: boolean;
    consumed: boolean;
    hasUserId: boolean;
    hasPendingRegistration: boolean;
    expiresAtEpochMs: number | null;
  } | null {
    const store = this.oauthTempStore as unknown as {
      peekAuthCodeStatus?: (inputCode: string) => {
        exists: boolean;
        expired: boolean;
        consumed: boolean;
        hasUserId: boolean;
        hasPendingRegistration: boolean;
        expiresAtEpochMs: number | null;
      };
    };
    if (typeof store.peekAuthCodeStatus !== 'function') return null;
    return store.peekAuthCodeStatus(code);
  }
}
