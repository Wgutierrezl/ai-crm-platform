import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../domain/ports/user.repository.port';
import { OauthTempStorePort } from '../../domain/ports/oauth-temp-store.port';

export interface ExchangeGoogleAuthCodeInput {
  code: string;
}

export interface ExchangeGoogleAuthCodeOutput {
  accessToken: string;
  userId: string;
  companyId: string;
  role: string;
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
    this.logger.log(
      `[GoogleOAuth][Exchange] processing code=${this.maskValue(input.code)}`,
    );
    const payload = await this.oauthTempStore.consumeAuthCode(input.code);
    this.logger.log(
      `[GoogleOAuth][Exchange] auth code lookup found=${Boolean(payload)}`,
    );
    if (!payload) {
      this.logger.warn(
        `[GoogleOAuth][Exchange] auth code invalid/expired/used code=${this.maskValue(input.code)}`,
      );
      throw new UnauthorizedException('Codigo OAuth invalido o expirado.');
    }

    const user = await this.userRepository.findById(payload.userId);
    this.logger.log(
      `[GoogleOAuth][Exchange] user lookup found=${Boolean(user)} userId=${this.maskValue(payload.userId)}`,
    );
    if (!user) {
      this.logger.warn(
        `[GoogleOAuth][Exchange] user missing for code userId=${this.maskValue(payload.userId)}`,
      );
      throw new UnauthorizedException('Usuario no encontrado para auth code.');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
    });
    return {
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
}
