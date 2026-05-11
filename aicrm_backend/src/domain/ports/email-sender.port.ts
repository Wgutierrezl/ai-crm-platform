export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  contentBase64: string;
}

export abstract class EmailSenderPort {
  abstract send(input: SendEmailInput): Promise<void>;
}
