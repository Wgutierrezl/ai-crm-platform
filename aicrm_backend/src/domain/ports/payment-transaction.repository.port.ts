import { PaymentTransaction } from '../entities/payment-transaction.entity';

export abstract class PaymentTransactionRepository {
  abstract create(transaction: PaymentTransaction): Promise<PaymentTransaction>;
  abstract update(transaction: PaymentTransaction): Promise<PaymentTransaction>;
  abstract findByIdempotencyKey(
    companyId: string,
    idempotencyKey: string,
  ): Promise<PaymentTransaction | null>;
  abstract findLatestByCartSessionId(
    companyId: string,
    cartSessionId: string,
  ): Promise<PaymentTransaction | null>;
  abstract findLatestByOrderId(
    companyId: string,
    orderId: string,
  ): Promise<PaymentTransaction | null>;
}
