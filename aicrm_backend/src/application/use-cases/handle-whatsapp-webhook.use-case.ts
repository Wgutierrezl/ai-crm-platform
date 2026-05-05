import { Injectable, Logger } from '@nestjs/common';
import { CompanyWhatsappAppRepository } from '../../domain/ports/company-whatsapp-app.repository.port';
import { CompanyWhatsappCredentialRepository } from '../../domain/ports/company-whatsapp-credential.repository.port';

interface IncomingWhatsappMessage {
  waId: string | null;
  from: string | null;
  body: string | null;
  messageId: string | null;
}

interface WhatsappWebhookMessageValue {
  id?: string;
  from?: string;
  text?: {
    body?: string;
  };
}

interface WhatsappWebhookValue {
  metadata?: {
    phone_number_id?: string;
  };
  messages?: WhatsappWebhookMessageValue[];
}

interface WhatsappWebhookChange {
  value?: WhatsappWebhookValue;
}

interface WhatsappWebhookEntry {
  changes?: WhatsappWebhookChange[];
}

interface WhatsappWebhookPayload {
  entry?: WhatsappWebhookEntry[];
}

@Injectable()
export class HandleWhatsappWebhookUseCase {
  private readonly logger = new Logger(HandleWhatsappWebhookUseCase.name);

  constructor(
    private readonly appRepository: CompanyWhatsappAppRepository,
    private readonly credentialRepository: CompanyWhatsappCredentialRepository,
  ) {}

  async execute(payload: unknown): Promise<void> {
    this.logger.log('Webhook WhatsApp recibido');

    const parsedPayload = payload as WhatsappWebhookPayload;
    const entries = Array.isArray(parsedPayload.entry)
      ? parsedPayload.entry
      : [];
    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        if (!phoneNumberId) {
          this.logger.warn(
            'Webhook recibido sin metadata.phone_number_id, se omite cambio',
          );
          continue;
        }

        const app = await this.appRepository.findByPhoneNumberId(phoneNumberId);
        if (!app || !app.isActive) {
          this.logger.warn(
            `No existe app activa para phone_number_id=${phoneNumberId}`,
          );
          continue;
        }

        const credential =
          await this.credentialRepository.findActiveByWhatsappAppId(app.id);
        if (!credential) {
          this.logger.warn(
            `No existe credencial activa para whatsapp_app_id=${app.id}`,
          );
          continue;
        }

        this.logger.log(
          `Webhook resuelto whatsappAppId=${app.id}, phoneNumberId=${app.phoneNumberId}`,
        );

        const messages = Array.isArray(value?.messages) ? value.messages : [];
        for (const message of messages) {
          const extracted: IncomingWhatsappMessage = {
            waId: message.from ?? null,
            from: message.from ?? null,
            body: message.text?.body ?? null,
            messageId: message.id ?? null,
          };

          this.logger.log(
            `Mensaje entrante whatsappAppId=${app.id}, wa_id=${extracted.waId ?? 'N/A'}, message_id=${extracted.messageId ?? 'N/A'}`,
          );
          this.logger.debug(
            `Contenido mensaje: ${extracted.body ?? '[sin texto]'} `,
          );

          // Punto de extension para siguiente fase:
          // - resolver/crear cliente por telefono
          // - resolver/crear conversacion
          // - invocar ProcessIncomingMessageUseCase y responder por WhatsApp
        }
      }
    }
  }
}
