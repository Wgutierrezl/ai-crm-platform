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
}
