import { OrderItem } from '../entities/order-item.entity';

export abstract class OrderItemRepository {
  abstract create(orderItem: OrderItem): Promise<OrderItem>;
  abstract findById(id: string): Promise<OrderItem | null>;
  abstract findAllByCompanyId(companyId: string): Promise<OrderItem[]>;
  abstract findByOrderId(orderId: string): Promise<OrderItem[]>;
}
