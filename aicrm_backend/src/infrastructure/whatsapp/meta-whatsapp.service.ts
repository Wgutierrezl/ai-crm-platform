import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WhatsappInteractiveListPayload,
  WhatsappMessageSender,
} from '../../domain/ports/whatsapp-message-sender.port';

@Injectable()
export class MetaWhatsappService implements WhatsappMessageSender {
  private readonly logger = new Logger(MetaWhatsappService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendTextMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: string,
  ): Promise<void> {
    this.logger.log(
      `Enviando mensaje WhatsApp via Meta API a to=${to}, phoneNumberId=${phoneNumberId}`,
    );

    const response = await this.sendMessage(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(
        `Error enviando mensaje a Meta status=${response.status} body=${body}`,
      );
      throw new Error('No fue posible enviar mensaje a Meta WhatsApp API');
    }
  }

  async sendInteractiveList(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    payload: WhatsappInteractiveListPayload,
  ): Promise<void> {
    this.logger.log(
      `Enviando lista interactiva WhatsApp a to=${to}, phoneNumberId=${phoneNumberId}, sections=${payload.sections.length}`,
    );

    const response = await this.sendMessage(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: payload.header ? { type: 'text', text: payload.header } : undefined,
        body: { text: payload.body },
        action: {
          button: payload.buttonText,
          sections: payload.sections.map((section) => ({
            title: section.title,
            rows: section.rows.map((row) => ({
              id: row.id,
              title: row.title,
              description: row.description,
            })),
          })),
        },
      },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(
        `Error enviando lista interactiva a Meta status=${response.status} body=${body}`,
      );
      throw new Error('No fue posible enviar lista interactiva a Meta WhatsApp API');
    }
  }

  private sendMessage(
    phoneNumberId: string,
    accessToken: string,
    body: Record<string, unknown>,
  ): Promise<Response> {
    const version = this.configService.get<string>(
      'META_GRAPH_API_VERSION',
      'v23.0',
    );
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    return fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  }
}
