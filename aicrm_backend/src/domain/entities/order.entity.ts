export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'cancelled'
  | 'confirmed'
  | 'mock_paid'
  | 'payment_failed';

export class Order {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly companyId: string,
    public readonly status: OrderStatus,
    public readonly total: number,
    public readonly createdAt: Date,
  ) {}
}
