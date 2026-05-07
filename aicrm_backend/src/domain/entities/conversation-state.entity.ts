export type ConversationLifecycleStatus = 'active' | 'closed';
export type RegistrationStep =
  | 'WAITING_NAME'
  | 'WAITING_EMAIL'
  | 'WAITING_DOCUMENT'
  | 'COMPLETED'
  | `awaiting_${string}`
  | 'completed';

export class ConversationState {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly companyId: string,
    public readonly status: ConversationLifecycleStatus,
    public readonly registrationStep: RegistrationStep,
    public readonly context: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
