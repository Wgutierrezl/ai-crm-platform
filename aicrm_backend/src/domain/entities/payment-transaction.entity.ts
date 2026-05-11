export type PaymentTransactionStatus =
  | 'approved'
  | 'rejected'
  | 'pending'
  | 'error';

export class PaymentTransaction {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly customerId: string,
    public readonly orderId: string | null,
    public readonly provider: string,
    public readonly status: PaymentTransactionStatus,
    public readonly amount: number,
    public readonly currency: string,
    public readonly mockReference: string,
    public readonly methodType: string | null,
    public readonly last4: string | null,
    public readonly brand: string | null,
    public readonly metadataJson: Record<string, unknown> | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
