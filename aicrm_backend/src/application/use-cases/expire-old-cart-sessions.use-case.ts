import { Injectable } from '@nestjs/common';
import { CartSessionRepository } from '../../domain/ports/cart-session.repository.port';

@Injectable()
export class ExpireOldCartSessionsUseCase {
  constructor(
    private readonly cartSessionRepository: CartSessionRepository,
  ) {}

  async execute(referenceDate = new Date()): Promise<number> {
    return this.cartSessionRepository.expireOldSessions(referenceDate);
  }
}
