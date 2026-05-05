import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CompanyWhatsappCredentialRepository } from '../../domain/ports/company-whatsapp-credential.repository.port';
import { CompanyWhatsappAppRepository } from '../../domain/ports/company-whatsapp-app.repository.port';

export interface VerifyWhatsappWebhookInput {
  mode?: string;
  verifyToken?: string;
  challenge?: string;
}

@Injectable()
export class VerifyWhatsappWebhookUseCase {
  private readonly logger = new Logger(VerifyWhatsappWebhookUseCase.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly credentialRepository: CompanyWhatsappCredentialRepository,
    private readonly appRepository: CompanyWhatsappAppRepository,
  ) {}

  async execute(input: VerifyWhatsappWebhookInput): Promise<string> {
    if (input.mode !== 'subscribe' || !input.verifyToken || !input.challenge) {
      this.logger.warn('Verificacion webhook invalida: parametros incompletos');
      throw new ForbiddenException('Verificacion webhook invalida');
    }

    const credential = await this.credentialRepository.findActiveByVerifyToken(
      input.verifyToken,
    );
    if (credential) {
      const app = await this.appRepository.findById(credential.whatsappAppId);
      if (!app || !app.isActive) {
        this.logger.warn(
          `Webhook token valido pero app inactiva/no encontrada appId=${credential.whatsappAppId}`,
        );
        throw new ForbiddenException('Token de verificacion invalido');
      }
      this.logger.log(
        `Webhook verificado por app activa id=${app.id}, phoneNumberId=${app.phoneNumberId}`,
      );
      return input.challenge;
    }

    const fallbackVerifyToken =
      this.configService.get<string>('META_VERIFY_TOKEN');
    if (fallbackVerifyToken && fallbackVerifyToken === input.verifyToken) {
      this.logger.warn(
        'Webhook verificado con META_VERIFY_TOKEN fallback. Recomendado usar credenciales por empresa.',
      );
      return input.challenge;
    }

    this.logger.warn('Webhook verificacion fallida: verify_token no coincide');
    throw new ForbiddenException('Token de verificacion invalido');
  }
}
