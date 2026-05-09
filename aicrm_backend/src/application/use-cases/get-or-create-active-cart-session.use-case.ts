import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CartSession } from '../../domain/entities/cart-session.entity';
import { CartSessionRepository } from '../../domain/ports/cart-session.repository.port';

export interface GetOrCreateActiveCartSessionInput {
  companyId: string;
  customerId: string;
  conversationId?: string | null;
  channel: string;
}

@Injectable()
export class GetOrCreateActiveCartSessionUseCase {
  constructor(
    private readonly cartSessionRepository: CartSessionRepository,
  ) {}

  async execute(input: GetOrCreateActiveCartSessionInput): Promise<CartSession> {
    const existing = await this.cartSessionRepository.findActiveByCustomer(
      input.companyId,
      input.customerId,
      input.channel,
    );

    if (existing) {
      if (existing.expiresAt.getTime() > Date.now()) {
        return existing;
      }

      await this.cartSessionRepository.update(
        new CartSession(
          existing.id,
          existing.companyId,
          existing.customerId,
          existing.conversationId,
          existing.channel,
          'expired',
          existing.expiresAt,
          existing.createdAt,
          new Date(),
        ),
      );
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return this.cartSessionRepository.create(
      new CartSession(
        uuidv4(),
        input.companyId,
        input.customerId,
        input.conversationId ?? null,
        input.channel,
        'active',
        expiresAt,
        now,
        now,
      ),
    );
  }
}
