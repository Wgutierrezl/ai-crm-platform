import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { CompanyWhatsappAppRepository } from '../../domain/ports/company-whatsapp-app.repository.port';
import { CompanyWhatsappCredentialRepository } from '../../domain/ports/company-whatsapp-credential.repository.port';

interface SignatureValidationInput {
  rawBody: Buffer | string | undefined;
  payload: unknown;
  signatureHeader?: string;
}

interface WebhookPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: {
          phone_number_id?: string;
        };
      };
    }>;
  }>;
}

@Injectable()
export class ValidateMetaWebhookSignatureUseCase {
  private readonly logger = new Logger(ValidateMetaWebhookSignatureUseCase.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly appRepository: CompanyWhatsappAppRepository,
    private readonly credentialRepository: CompanyWhatsappCredentialRepository,
  ) {}

  async execute(input: SignatureValidationInput): Promise<void> {
    const validateSignature =
      this.configService.get<string>('WHATSAPP_WEBHOOK_VALIDATE_SIGNATURE', 'false') ===
      'true';

    if (!validateSignature) {
      this.logger.log(
        'Validacion de firma de webhook desactivada por configuracion. Uso recomendado solo local/dev.',
      );
      return;
    }

    if (!input.rawBody || this.getRawBodyBuffer(input.rawBody).length === 0) {
      this.logger.warn('Webhook rechazado: rawBody no disponible para validar firma');
      throw new UnauthorizedException('Firma de webhook invalida');
    }

    const signatureHex = this.parseSignatureHeader(input.signatureHeader);
    if (!signatureHex) {
      this.logger.warn('Webhook rechazado: header x-hub-signature-256 ausente o invalido');
      throw new UnauthorizedException('Firma de webhook invalida');
    }

    const phoneNumberId = this.extractPhoneNumberId(input.payload);
    if (!phoneNumberId) {
      this.logger.warn('Webhook rechazado: phone_number_id ausente en payload');
      throw new ForbiddenException('No se pudo validar firma de webhook');
    }

    const app = await this.appRepository.findByPhoneNumberId(phoneNumberId);
    if (!app || !app.isActive) {
      this.logger.warn(
        `Webhook rechazado: app WhatsApp no activa/no encontrada para phoneNumberId=${phoneNumberId}`,
      );
      throw new ForbiddenException('No se pudo validar firma de webhook');
    }

    const credential = await this.credentialRepository.findActiveByWhatsappAppId(app.id);
    if (!credential) {
      this.logger.warn(
        `Webhook rechazado: credenciales activas no encontradas para whatsappAppId=${app.id}`,
      );
      throw new ForbiddenException('No se pudo validar firma de webhook');
    }

    const appSecret = this.resolveAppSecret(credential.appSecret, app.id, phoneNumberId);
    const rawBodyBuffer = this.getRawBodyBuffer(input.rawBody);
    const expectedHex = createHmac('sha256', appSecret)
      .update(rawBodyBuffer)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedHex, 'hex');
    const providedBuffer = Buffer.from(signatureHex, 'hex');

    if (
      expectedBuffer.length === 0 ||
      providedBuffer.length === 0 ||
      expectedBuffer.length !== providedBuffer.length
    ) {
      this.logger.warn(
        `Webhook rechazado: longitud de firma invalida para whatsappAppId=${app.id}`,
      );
      throw new UnauthorizedException('Firma de webhook invalida');
    }

    const isValid = timingSafeEqual(expectedBuffer, providedBuffer);
    if (!isValid) {
      this.logger.warn(
        `Webhook rechazado: firma no coincide para whatsappAppId=${app.id}, companyId=${app.companyId ?? 'null'}`,
      );
      throw new UnauthorizedException('Firma de webhook invalida');
    }

    this.logger.log(
      `Webhook firmado validado correctamente para whatsappAppId=${app.id}, companyId=${app.companyId ?? 'null'}`,
    );
  }

  private parseSignatureHeader(signatureHeader?: string): string | null {
    if (!signatureHeader) return null;

    const match = /^sha256=([a-fA-F0-9]{64})$/.exec(signatureHeader.trim());
    return match ? match[1].toLowerCase() : null;
  }

  private extractPhoneNumberId(payload: unknown): string | null {
    const parsedPayload = payload as WebhookPayload;
    const entries = Array.isArray(parsedPayload.entry) ? parsedPayload.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const phoneNumberId = change?.value?.metadata?.phone_number_id;
        if (typeof phoneNumberId === 'string' && phoneNumberId.trim()) {
          return phoneNumberId.trim();
        }
      }
    }

    return null;
  }

  private resolveAppSecret(
    dynamicSecret: string | null,
    whatsappAppId: number,
    phoneNumberId: string,
  ): string {
    if (dynamicSecret && dynamicSecret.trim()) {
      return dynamicSecret;
    }

    const allowGlobalFallback =
      this.configService.get<string>(
        'WHATSAPP_WEBHOOK_ALLOW_GLOBAL_SECRET_FALLBACK',
        'false',
      ) === 'true';

    if (!allowGlobalFallback) {
      this.logger.warn(
        `Webhook rechazado: app_secret ausente en BD para whatsappAppId=${whatsappAppId}, phoneNumberId=${phoneNumberId} y fallback global deshabilitado`,
      );
      throw new ForbiddenException('No se pudo validar firma de webhook');
    }

    const fallbackSecret = this.configService.get<string>('META_APP_SECRET', '').trim();
    if (!fallbackSecret) {
      this.logger.warn(
        `Webhook rechazado: fallback global habilitado pero META_APP_SECRET vacio para whatsappAppId=${whatsappAppId}`,
      );
      throw new ForbiddenException('No se pudo validar firma de webhook');
    }

    this.logger.warn(
      `Validando webhook con META_APP_SECRET fallback para whatsappAppId=${whatsappAppId}, phoneNumberId=${phoneNumberId}. Configuracion recomendada: app_secret por app en BD.`,
    );
    return fallbackSecret;
  }

  private getRawBodyBuffer(rawBody: Buffer | string): Buffer {
    return Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody);
  }
}
