import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  WhatsappImagePayload,
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
    this.logger.log(`[WhatsAppSender] Sending text message to=${to} phoneNumberId=${phoneNumberId}`);

    const response = await this.sendMessage(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`[WhatsAppSender] Meta API error status=${response.status} body=${body}`);
      throw new Error('No fue posible enviar mensaje a Meta WhatsApp API');
    }
    this.logger.log(`[WhatsAppSender] Text message delivered status=${response.status}`);
  }

  async sendInteractiveList(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    payload: WhatsappInteractiveListPayload,
  ): Promise<void> {
    const rows = payload.sections.reduce((acc, section) => acc + section.rows.length, 0);
    this.logger.log(`[WhatsAppSender] Preparing interactive list rows=${rows}`);
    const safePayload =
      rows > 10
        ? this.applyRowsLimit(payload, 10)
        : payload;
    const safeRows = safePayload.sections.reduce(
      (acc, section) => acc + section.rows.length,
      0,
    );
    if (rows > 10) {
      this.logger.warn(
        `[WhatsAppSender] Rows exceed Meta limit. rows=${rows}. Applying safe truncation/fallback.`,
      );
    }
    this.logger.log(`[WhatsAppSender] Sending interactive list to=${to} rows=${rows}`);

    const response = await this.sendMessage(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: safePayload.header ? { type: 'text', text: safePayload.header } : undefined,
        body: { text: safePayload.body },
        action: {
          button: safePayload.buttonText,
          sections: safePayload.sections.map((section) => ({
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
      this.logger.error(`[WhatsAppSender] Meta API error status=${response.status} body=${body}`);
      throw new Error('No fue posible enviar lista interactiva a Meta WhatsApp API');
    }
    this.logger.log(`[WhatsAppSender] Interactive list delivered status=${response.status} rows=${safeRows}`);
  }

  async sendImageMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    payload: WhatsappImagePayload,
  ): Promise<void> {
    this.logger.log(`[WhatsAppSender] Sending image message to=${to} imageUrl=${payload.imageUrl}`);

    const response = await this.sendMessage(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: {
        link: payload.imageUrl,
        caption: payload.caption,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`[WhatsAppSender] Meta API error status=${response.status} body=${body}`);
      throw new Error('No fue posible enviar imagen a Meta WhatsApp API');
    }
    this.logger.log(`[WhatsAppSender] Image message delivered status=${response.status}`);
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

  private applyRowsLimit(
    payload: WhatsappInteractiveListPayload,
    maxRows: number,
  ): WhatsappInteractiveListPayload {
    const sections: WhatsappInteractiveListPayload['sections'] = [];
    let remaining = maxRows;
    for (const section of payload.sections) {
      if (remaining <= 0) break;
      const rows = section.rows.slice(0, remaining);
      if (rows.length > 0) {
        sections.push({ title: section.title, rows });
        remaining -= rows.length;
      }
    }
    return {
      header: payload.header,
      body: payload.body,
      buttonText: payload.buttonText,
      sections,
    };
  }
}
