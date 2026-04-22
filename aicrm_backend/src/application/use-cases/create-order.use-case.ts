import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { OrderRepository } from '../../domain/ports/order.repository.port';
import { OrderItemRepository } from '../../domain/ports/order-item.repository.port';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  customerId: string;
  companyId: string;
  items: CreateOrderItemInput[];
}

export interface CreateOrderOutput {
  order: Order;
  items: OrderItem[];
}

/**
 * Caso de uso para crear un pedido y sus items para una empresa.
 */
@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    const total = input.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = new Order(
      uuidv4(),
      input.customerId,
      input.companyId,
      'pending',
      total,
      new Date(),
    );

    const savedOrder = await this.orderRepository.create(order);

    const savedItems: OrderItem[] = [];
    for (const item of input.items) {
      const orderItem = new OrderItem(
        uuidv4(),
        savedOrder.id,
        item.productId,
        input.companyId,
        item.quantity,
        item.price,
      );
      const savedItem = await this.orderItemRepository.create(orderItem);
      savedItems.push(savedItem);
    }

    return { order: savedOrder, items: savedItems };
  }
}
