import { PaymentTransaction } from '../entities/payment-transaction.entity';

export abstract class PaymentTransactionRepository {
  abstract create(
    transaction: PaymentTransaction,
  ): Promise<PaymentTransaction>;
}
