export type CartSessionStatus =
  | 'active'
  | 'checkout_pending'
  | 'checked_out'
  | 'expired'
  | 'abandoned';

export class CartSession {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly customerId: string,
    public readonly conversationId: string | null,
    public readonly channel: string,
    public readonly status: CartSessionStatus,
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
