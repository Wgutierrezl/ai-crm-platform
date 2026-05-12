export type CustomerOauthLinkSessionStatus = 'pending' | 'consumed';
export type CustomerOauthLinkSessionResultStatus =
  | 'success'
  | 'cancelled'
  | 'failed'
  | 'expired'
  | null;

export class CustomerOauthLinkSession {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly customerId: string,
    public readonly conversationId: string,
    public readonly channel: string,
    public readonly externalUserId: string,
    public readonly provider: string,
    public readonly stateToken: string,
    public readonly status: CustomerOauthLinkSessionStatus,
    public readonly expiresAt: Date,
    public readonly consumedAt: Date | null,
    public readonly resultStatus: CustomerOauthLinkSessionResultStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

