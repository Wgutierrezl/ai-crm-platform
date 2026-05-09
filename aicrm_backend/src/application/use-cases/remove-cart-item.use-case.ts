import { Injectable, NotFoundException } from '@nestjs/common';
import { CartItemRepository } from '../../domain/ports/cart-item.repository.port';
import { GetOrCreateActiveCartSessionUseCase } from './get-or-create-active-cart-session.use-case';

export interface RemoveCartItemInput {
  companyId: string;
  customerId: string;
  conversationId?: string | null;
  channel: string;
  itemId: string;
}

@Injectable()
export class RemoveCartItemUseCase {
  constructor(
    private readonly cartItemRepository: CartItemRepository,
    private readonly getOrCreateActiveCartSessionUseCase: GetOrCreateActiveCartSessionUseCase,
  ) {}

  async execute(input: RemoveCartItemInput): Promise<void> {
    const session = await this.getOrCreateActiveCartSessionUseCase.execute({
      companyId: input.companyId,
      customerId: input.customerId,
      conversationId: input.conversationId ?? null,
      channel: input.channel,
    });

    const item = await this.cartItemRepository.findByIdAndCartSessionId(
      input.itemId,
      session.id,
    );
    if (!item) {
      throw new NotFoundException('Item de carrito no encontrado');
    }
    await this.cartItemRepository.remove(item.id);
  }
}
