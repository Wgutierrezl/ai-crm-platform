export abstract class WhatsappMessageSender {
  abstract sendTextMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: string,
  ): Promise<void>;
}
