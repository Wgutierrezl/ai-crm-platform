import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { OauthIdentityRepository } from '../../domain/ports/oauth-identity.repository.port';
import { OauthRegistrationSessionRepository } from '../../domain/ports/oauth-registration-session.repository.port';
import { UserRepository } from '../../domain/ports/user.repository.port';
import { CompanyOrmEntity } from '../../infrastructure/database/entities/company.orm-entity';
import { OauthIdentityOrmEntity } from '../../infrastructure/database/entities/oauth-identity.orm-entity';
import { OauthRegistrationSessionOrmEntity } from '../../infrastructure/database/entities/oauth-registration-session.orm-entity';
import { UserOrmEntity } from '../../infrastructure/database/entities/user.orm-entity';

export interface CompleteGoogleRegistrationInput {
  registrationToken: string;
  companyName: string;
  identificationType: 'CC' | 'NIT';
  identificationNumber: string;
}

export interface CompleteGoogleRegistrationOutput {
  accessToken: string;
  userId: string;
  companyId: string;
  role: string;
}

@Injectable()
export class CompleteGoogleRegistrationUseCase {
  private readonly logger = new Logger(CompleteGoogleRegistrationUseCase.name);
  constructor(
    private readonly oauthRegistrationSessionRepository: OauthRegistrationSessionRepository,
    private readonly oauthIdentityRepository: OauthIdentityRepository,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
  ) {}

  async execute(
    input: CompleteGoogleRegistrationInput,
  ): Promise<CompleteGoogleRegistrationOutput> {
    this.logger.log(
      `[GoogleOAuth][CompleteRegistration] start token=${this.maskValue(input.registrationToken)} companyNamePresent=${Boolean(
        input.companyName?.trim(),
      )} identificationType=${input.identificationType} identificationNumber=${this.maskValue(input.identificationNumber)}`,
    );
    const session = await this.oauthRegistrationSessionRepository.findById(
      input.registrationToken,
    );
    if (!session) {
      this.logger.warn(
        `[GoogleOAuth][CompleteRegistration] reject401 reason=session_not_found token=${this.maskValue(input.registrationToken)}`,
      );
      throw new UnauthorizedException('Token de registro invalido.');
    }
    this.logger.log(
      `[GoogleOAuth][CompleteRegistration] session found id=${this.maskValue(session.id)} status=${session.status} email=${this.maskValue(
        session.email,
      )} expired=${session.expiresAt.getTime() < Date.now()} consumed=${Boolean(session.consumedAt)}`,
    );
    if (session.status !== 'pending' || session.consumedAt) {
      this.logger.warn(
        `[GoogleOAuth][CompleteRegistration] reject401 reason=session_already_consumed status=${session.status} consumedAt=${session.consumedAt?.toISOString() ?? 'null'}`,
      );
      throw new UnauthorizedException('Token de registro ya fue consumido.');
    }
    if (session.expiresAt.getTime() < Date.now()) {
      this.logger.warn(
        `[GoogleOAuth][CompleteRegistration] reject401 reason=session_expired expiresAt=${session.expiresAt.toISOString()}`,
      );
      throw new UnauthorizedException('Token de registro expirado.');
    }
    if (!session.emailVerified) {
      this.logger.warn(
        `[GoogleOAuth][CompleteRegistration] reject401 reason=email_not_verified email=${this.maskValue(session.email)}`,
      );
      throw new UnauthorizedException('Google reporta email no verificado.');
    }
    if (session.provider !== 'google') {
      this.logger.warn(
        `[GoogleOAuth][CompleteRegistration] reject400 reason=unsupported_provider provider=${session.provider}`,
      );
      throw new BadRequestException('Proveedor OAuth no soportado.');
    }

    const linkedIdentity = await this.oauthIdentityRepository.findByProviderUserId(
      session.provider,
      session.providerUserId,
    );
    if (linkedIdentity) {
      this.logger.warn(
        `[GoogleOAuth][CompleteRegistration] reject409 reason=identity_already_linked providerUserId=${this.maskValue(session.providerUserId)}`,
      );
      throw new ConflictException('La identidad Google ya esta vinculada.');
    }

    const existingUserByEmail = await this.userRepository.findByEmail(session.email);
    if (existingUserByEmail) {
      this.logger.warn(
        `[GoogleOAuth][CompleteRegistration] reject409 reason=email_already_exists email=${this.maskValue(session.email)} userId=${this.maskValue(existingUserByEmail.id)}`,
      );
      throw new ConflictException('Ya existe un usuario con ese email.');
    }

    const now = new Date();
    const companyId = uuidv4();
    const userId = uuidv4();
    const oauthIdentityId = uuidv4();
    const placeholderPasswordHash = await bcrypt.hash(
      `oauth_google_${uuidv4().replace(/-/g, '')}`,
      10,
    );

    await this.dataSource.transaction(async (manager) => {
      await manager.save(
        CompanyOrmEntity,
        manager.create(CompanyOrmEntity, {
          id: companyId,
          name: input.companyName.trim(),
          createdAt: now,
          assistantName: null,
          assistantContext: null,
          assistantWelcomeMessage: null,
        }),
      );
      this.logger.log(
        `[GoogleOAuth][CompleteRegistration] company created companyId=${this.maskValue(companyId)}`,
      );

      await manager.save(
        UserOrmEntity,
        manager.create(UserOrmEntity, {
          id: userId,
          email: session.email,
          passwordHash: placeholderPasswordHash,
          identificationType: input.identificationType,
          identificationNumber: input.identificationNumber.trim(),
          fullName: session.fullName ?? undefined,
          role: 'admin',
          companyId,
          createdAt: now,
        }),
      );
      this.logger.log(
        `[GoogleOAuth][CompleteRegistration] user created userId=${this.maskValue(userId)} identificationType=${input.identificationType} identificationNumber=${this.maskValue(
          input.identificationNumber,
        )}`,
      );

      await manager.save(
        OauthIdentityOrmEntity,
        manager.create(OauthIdentityOrmEntity, {
          id: oauthIdentityId,
          provider: session.provider,
          providerUserId: session.providerUserId,
          userId,
          email: session.email,
          emailVerified: session.emailVerified,
          displayName: session.fullName,
          pictureUrl: session.pictureUrl,
          linkedAt: now,
          createdAt: now,
          updatedAt: now,
        }),
      );
      this.logger.log(
        `[GoogleOAuth][CompleteRegistration] oauth identity created id=${this.maskValue(oauthIdentityId)} providerUserId=${this.maskValue(
          session.providerUserId,
        )}`,
      );

      await manager.update(
        OauthRegistrationSessionOrmEntity,
        { id: session.id },
        {
          status: 'consumed',
          consumedAt: now,
          updatedAt: now,
        },
      );
      this.logger.log(
        `[GoogleOAuth][CompleteRegistration] session consumed sessionId=${this.maskValue(session.id)} consumedAt=${now.toISOString()}`,
      );
    });

    const accessToken = this.jwtService.sign({
      sub: userId,
      email: session.email,
      companyId,
      role: 'admin',
    });
    this.logger.log(
      `[GoogleOAuth][CompleteRegistration] jwt emitted userId=${this.maskValue(userId)} companyId=${this.maskValue(companyId)} jwt=${this.maskValue(
        accessToken,
      )}`,
    );

    return {
      accessToken,
      userId,
      companyId,
      role: 'admin',
    };
  }

  private maskValue(value: string | null | undefined): string {
    const input = String(value ?? '').trim();
    if (!input) return 'empty';
    if (input.length <= 8) return `${input.slice(0, 2)}***${input.slice(-1)}`;
    return `${input.slice(0, 4)}...${input.slice(-4)}`;
  }
}
