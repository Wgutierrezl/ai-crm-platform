import { Injectable } from '@nestjs/common';
import { CartItemRepository } from '../../domain/ports/cart-item.repository.port';
import { GetOrCreateActiveCartSessionUseCase } from './get-or-create-active-cart-session.use-case';

export interface ClearCartInput {
  companyId: string;
  customerId: string;
  conversationId?: string | null;
  channel: string;
}

@Injectable()
export class ClearCartUseCase {
  constructor(
    private readonly cartItemRepository: CartItemRepository,
    private readonly getOrCreateActiveCartSessionUseCase: GetOrCreateActiveCartSessionUseCase,
  ) {}

  async execute(input: ClearCartInput): Promise<void> {
    const session = await this.getOrCreateActiveCartSessionUseCase.execute({
      companyId: input.companyId,
      customerId: input.customerId,
      conversationId: input.conversationId ?? null,
      channel: input.channel,
    });

    await this.cartItemRepository.removeByCartSessionId(session.id);
  }
}
