export type MessageRole = 'customer' | 'agent' | 'bot';
export type MessageSourceChannel = 'api' | 'whatsapp';

export class Message {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly companyId: string,
    public readonly content: string,
    public readonly role: MessageRole,
    public readonly createdAt: Date,
    public readonly sourceChannel: MessageSourceChannel = 'api',
    public readonly channelMessageId: string | null = null,
    public readonly metadata: Record<string, unknown> | null = null,
  ) {}
}
