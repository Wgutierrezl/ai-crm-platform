import { Injectable } from '@nestjs/common';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CartSession } from '../../domain/entities/cart-session.entity';
import { CartItemRepository } from '../../domain/ports/cart-item.repository.port';
import { GetOrCreateActiveCartSessionUseCase } from './get-or-create-active-cart-session.use-case';

export interface ViewCartInput {
  companyId: string;
  customerId: string;
  conversationId?: string | null;
  channel: string;
}

export interface ViewCartOutput {
  session: CartSession;
  items: CartItem[];
  totals: {
    totalItems: number;
    subtotal: number;
    currency: string;
  };
}

@Injectable()
export class ViewCartUseCase {
  constructor(
    private readonly getOrCreateActiveCartSessionUseCase: GetOrCreateActiveCartSessionUseCase,
    private readonly cartItemRepository: CartItemRepository,
  ) {}

  async execute(input: ViewCartInput): Promise<ViewCartOutput> {
    const session = await this.getOrCreateActiveCartSessionUseCase.execute({
      companyId: input.companyId,
      customerId: input.customerId,
      conversationId: input.conversationId ?? null,
      channel: input.channel,
    });
    const items = await this.cartItemRepository.findByCartSessionId(session.id);
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = items.reduce(
      (acc, item) => acc + item.quantity * item.unitPriceSnapshot,
      0,
    );
    const currency = items[0]?.currencySnapshot ?? 'COP';

    return {
      session,
      items,
      totals: { totalItems, subtotal, currency },
    };
  }
}
