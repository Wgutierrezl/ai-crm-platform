import { CartSession } from '../entities/cart-session.entity';

export abstract class CartSessionRepository {
  abstract create(session: CartSession): Promise<CartSession>;
  abstract update(session: CartSession): Promise<CartSession>;
  abstract findActiveByCustomer(
    companyId: string,
    customerId: string,
    channel: string,
  ): Promise<CartSession | null>;
  abstract findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<CartSession | null>;
  abstract transitionStatus(
    input: {
      id: string;
      companyId: string;
      fromStatus: CartSession['status'];
      toStatus: CartSession['status'];
    },
  ): Promise<boolean>;
  abstract expireOldSessions(referenceDate: Date): Promise<number>;
}
