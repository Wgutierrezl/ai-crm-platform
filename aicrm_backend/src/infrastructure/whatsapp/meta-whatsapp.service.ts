import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappMessageSender } from '../../domain/ports/whatsapp-message-sender.port';

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
    const version = this.configService.get<string>(
      'META_GRAPH_API_VERSION',
      'v23.0',
    );
    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    this.logger.log(
      `Enviando mensaje WhatsApp via Meta API a to=${to}, phoneNumberId=${phoneNumberId}`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(
        `Error enviando mensaje a Meta status=${response.status} body=${body}`,
      );
      throw new Error('No fue posible enviar mensaje a Meta WhatsApp API');
    }
  }
}
