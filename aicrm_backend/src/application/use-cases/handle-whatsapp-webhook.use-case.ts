import { Injectable, Logger } from '@nestjs/common';
import { CompanyWhatsappAppRepository } from '../../domain/ports/company-whatsapp-app.repository.port';
import { CompanyWhatsappCredentialRepository } from '../../domain/ports/company-whatsapp-credential.repository.port';
import { WhatsappMessageSender } from '../../domain/ports/whatsapp-message-sender.port';
import { HandleInboundChannelMessageUseCase } from './handle-inbound-channel-message.use-case';

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
  interactive?: {
    list_reply?: {
      id?: string;
      title?: string;
      description?: string;
    };
    button_reply?: {
      id?: string;
      title?: string;
    };
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
    private readonly whatsappMessageSender: WhatsappMessageSender,
    private readonly handleInboundChannelMessageUseCase: HandleInboundChannelMessageUseCase,
  ) {}

  async execute(payload: unknown): Promise<void> {
    const parsedPayload = payload as WhatsappWebhookPayload;
    const entries = Array.isArray(parsedPayload.entry) ? parsedPayload.entry : [];

    for (const entry of entries) {
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      for (const change of changes) {
        const value = change.value;
        const phoneNumberId = value?.metadata?.phone_number_id;

        if (!phoneNumberId) {
          continue;
        }

        const app = await this.appRepository.findByPhoneNumberId(phoneNumberId);
        if (!app || !app.isActive) {
          continue;
        }

        const credential =
          await this.credentialRepository.findActiveByWhatsappAppId(app.id);
        if (!credential) {
          continue;
        }

        const messages = Array.isArray(value?.messages) ? value.messages : [];
        for (const message of messages) {
          const interactiveReplyId =
            message.interactive?.list_reply?.id ??
            message.interactive?.button_reply?.id ??
            null;
          const interactiveReplyTitle =
            message.interactive?.list_reply?.title ??
            message.interactive?.button_reply?.title ??
            null;
          if (interactiveReplyId) {
            this.logger.log(
              `[WhatsAppWebhook] interactiveReplyId=${interactiveReplyId} title=${interactiveReplyTitle ?? ''}`,
            );
          }
          const inboundBody = message.text?.body ?? interactiveReplyId ?? interactiveReplyTitle;

          if (!inboundBody) {
            continue;
          }

          const extracted: IncomingWhatsappMessage = {
            waId: message.from ?? null,
            from: message.from ?? null,
            body: inboundBody,
            messageId: message.id ?? null,
          };

          const recipientPhone = extracted.waId ?? extracted.from;
          if (!recipientPhone || !extracted.body) {
            continue;
          }

          try {
            if (!app.companyId) {
              this.logger.warn(
                `Configuracion incompleta: app WhatsApp id=${app.id} sin companyId. El mensaje se omite hasta asociar tenant.`,
              );
              continue;
            }

            const result = await this.handleInboundChannelMessageUseCase.execute({
              companyId: app.companyId,
              channel: 'whatsapp',
              externalUserId: recipientPhone,
              phone: extracted.from,
              text: extracted.body,
              channelMessageId: extracted.messageId,
              metadata: {
                whatsappAppId: app.id,
                phoneNumberId: app.phoneNumberId,
                interactiveReplyId,
                interactiveReplyTitle,
              },
            });

            if (result.shouldReply && result.reply) {
              if (result.image) {
                try {
                  await this.whatsappMessageSender.sendImageMessage(
                    app.phoneNumberId,
                    credential.accessToken,
                    recipientPhone,
                    result.image,
                  );
                } catch (imageError) {
                  this.logger.warn(
                    `Fallo envio de imagen, se continua con fallback textual. detalle=${imageError instanceof Error ? imageError.message : 'unknown'}`,
                  );
                }
              }

              if (result.interactiveList) {
                try {
                  if (!result.image && result.reply) {
                    await this.whatsappMessageSender.sendTextMessage(
                      app.phoneNumberId,
                      credential.accessToken,
                      recipientPhone,
                      result.reply,
                    );
                  }
                  await this.whatsappMessageSender.sendInteractiveList(
                    app.phoneNumberId,
                    credential.accessToken,
                    recipientPhone,
                    result.interactiveList,
                  );
                } catch (interactiveError) {
                  this.logger.warn(
                    `Fallo envio de lista interactiva, se usa fallback texto. detalle=${interactiveError instanceof Error ? interactiveError.message : 'unknown'}`,
                  );
                  await this.whatsappMessageSender.sendTextMessage(
                    app.phoneNumberId,
                    credential.accessToken,
                    recipientPhone,
                    result.reply,
                  );
                }
              } else {
                await this.whatsappMessageSender.sendTextMessage(
                  app.phoneNumberId,
                  credential.accessToken,
                  recipientPhone,
                  result.reply,
                );
              }
            } else if (result.shouldReply && result.interactiveList) {
              await this.whatsappMessageSender.sendInteractiveList(
                app.phoneNumberId,
                credential.accessToken,
                recipientPhone,
                result.interactiveList,
              );
            }
          } catch (error) {
            this.logger.error(
              'Error procesando webhook de WhatsApp',
              error instanceof Error ? error.stack : undefined,
            );
          }
        }
      }
    }
  }
}
