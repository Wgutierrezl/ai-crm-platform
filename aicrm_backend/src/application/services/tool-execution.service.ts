import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Customer } from '../../domain/entities/customer.entity';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { OrderItemRepository } from '../../domain/ports/order-item.repository.port';
import { OrderRepository } from '../../domain/ports/order.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';

export interface ToolExecutionContext {
  companyId: string;
}

export interface ToolExecutionResult {
  actionExecuted?: string;
  replySuffix?: string;
}

@Injectable()
export class ToolExecutionService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
  ) {}

  async execute(
    type: string,
    payload: Record<string, any> | undefined,
    context: ToolExecutionContext,
  ): Promise<ToolExecutionResult> {
    if (type === 'GET_PRODUCTS') {
      const products = await this.productRepository.findAllByCompanyId(
        context.companyId,
      );
      const productList = products
        .map((p) => `- ${p.name}: $${p.price} (stock: ${p.stock})`)
        .join('\n');
      return {
        actionExecuted: 'GET_PRODUCTS',
        replySuffix: `\n\nProductos disponibles:\n${productList}`,
      };
    }

    if (type === 'CREATE_CUSTOMER' && payload) {
      const newCustomer = new Customer(
        uuidv4(),
        payload.name,
        payload.phone,
        payload.email,
        context.companyId,
        payload.identificationType,
        payload.identificationNumber,
      );
      await this.customerRepository.create(newCustomer);
      return { actionExecuted: 'CREATE_CUSTOMER' };
    }

    if (type === 'CREATE_ORDER' && payload) {
      const items: Array<{ productId: string; quantity: number; price: number }> =
        payload.items ?? [];
      const total = items.reduce(
        (sum: number, i: { price: number; quantity: number }) =>
          sum + i.price * i.quantity,
        0,
      );

      const order = new Order(
        uuidv4(),
        payload.customerId,
        context.companyId,
        'pending',
        total,
        new Date(),
      );
      const savedOrder = await this.orderRepository.create(order);

      for (const item of items) {
        const orderItem = new OrderItem(
          uuidv4(),
          savedOrder.id,
          item.productId,
          context.companyId,
          item.quantity,
          item.price,
        );
        await this.orderItemRepository.create(orderItem);
      }

      return {
        actionExecuted: 'CREATE_ORDER',
        replySuffix: `\n\nPedido creado exitosamente. ID: ${savedOrder.id}. Total: $${total}`,
      };
    }

    return {};
  }
}
