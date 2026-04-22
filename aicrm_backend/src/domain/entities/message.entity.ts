export type MessageRole = 'customer' | 'agent' | 'bot';

export class Message {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly companyId: string,
    public readonly content: string,
    public readonly role: MessageRole,
    public readonly createdAt: Date,
  ) {}
}
