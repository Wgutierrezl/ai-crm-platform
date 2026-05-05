import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CompanyWhatsappAppRepository } from '../../domain/ports/company-whatsapp-app.repository.port';
import { CompanyWhatsappCredentialRepository } from '../../domain/ports/company-whatsapp-credential.repository.port';
import { CompanyWhatsappCredential } from '../../domain/entities/company-whatsapp-credential.entity';

export interface UpsertCompanyWhatsappCredentialInput {
  whatsappAppId: number;
  accessToken: string;
  verifyToken: string;
  appSecret?: string;
}

export interface UpsertCompanyWhatsappCredentialOutput {
  id: string;
  whatsappAppId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UpsertCompanyWhatsappCredentialUseCase {
  private readonly logger = new Logger(
    UpsertCompanyWhatsappCredentialUseCase.name,
  );

  constructor(
    private readonly appRepository: CompanyWhatsappAppRepository,
    private readonly credentialRepository: CompanyWhatsappCredentialRepository,
  ) {}

  private sanitize(
    credential: CompanyWhatsappCredential,
  ): UpsertCompanyWhatsappCredentialOutput {
    return {
      id: credential.id,
      whatsappAppId: credential.whatsappAppId,
      isActive: credential.isActive,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    };
  }

  async execute(
    input: UpsertCompanyWhatsappCredentialInput,
  ): Promise<UpsertCompanyWhatsappCredentialOutput> {
    const app = await this.appRepository.findById(input.whatsappAppId);
    if (!app) {
      throw new NotFoundException(
        `No existe la app de WhatsApp con id=${input.whatsappAppId}`,
      );
    }

    const existing = await this.credentialRepository.findByWhatsappAppId(
      input.whatsappAppId,
    );

    if (existing) {
      this.logger.log(
        `Actualizando credenciales de WhatsApp para whatsappAppId=${input.whatsappAppId}`,
      );

      const updated = new CompanyWhatsappCredential(
        existing.id,
        input.whatsappAppId,
        input.accessToken,
        input.verifyToken,
        input.appSecret ?? null,
        true,
        existing.createdAt,
        new Date(),
      );
      const saved = await this.credentialRepository.update(updated);
      return this.sanitize(saved);
    }

    this.logger.log(
      `Registrando nuevas credenciales de WhatsApp para whatsappAppId=${input.whatsappAppId}`,
    );
    const created = new CompanyWhatsappCredential(
      uuidv4(),
      input.whatsappAppId,
      input.accessToken,
      input.verifyToken,
      input.appSecret ?? null,
      true,
      new Date(),
      new Date(),
    );
    const saved = await this.credentialRepository.create(created);
    return this.sanitize(saved);
  }
}
