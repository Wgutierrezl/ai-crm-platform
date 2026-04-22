import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../domain/ports/order.repository.port';
import { Order } from '../../domain/entities/order.entity';

/**
 * Caso de uso para listar pedidos por empresa.
 */
@Injectable()
export class GetOrdersByCompanyUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(companyId: string): Promise<Order[]> {
    return this.orderRepository.findAllByCompanyId(companyId);
  }
}
