export interface WhatsappInteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsappInteractiveListSection {
  title: string;
  rows: WhatsappInteractiveListRow[];
}

export interface WhatsappInteractiveListPayload {
  header?: string;
  body: string;
  buttonText: string;
  sections: WhatsappInteractiveListSection[];
}

export interface WhatsappImagePayload {
  imageUrl: string;
  caption?: string;
}

export interface WhatsappUrlButtonPayload {
  body: string;
  buttonText: string;
  url: string;
}

export abstract class WhatsappMessageSender {
  abstract sendTextMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    message: string,
  ): Promise<void>;

  abstract sendInteractiveList(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    payload: WhatsappInteractiveListPayload,
  ): Promise<void>;

  abstract sendImageMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    payload: WhatsappImagePayload,
  ): Promise<void>;

  abstract sendUrlButtonMessage(
    phoneNumberId: string,
    accessToken: string,
    to: string,
    payload: WhatsappUrlButtonPayload,
  ): Promise<void>;
}
