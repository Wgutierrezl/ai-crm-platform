import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../../domain/ports/order.repository.port';
import { Order } from '../../domain/entities/order.entity';
import { OrderItemRepository } from '../../domain/ports/order-item.repository.port';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { PaymentTransactionRepository } from '../../domain/ports/payment-transaction.repository.port';

export interface OrderListItemProductView {
  id: string;
  name: string;
  description: string | null;
  currency: string | null;
}

export interface OrderListItemView {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
  product: OrderListItemProductView | null;
}

export interface OrderPaymentView {
  id: string;
  status: string;
  provider: string;
  amount: number;
  currency: string;
  mockReference: string;
  methodType: string | null;
  last4: string | null;
  brand: string | null;
  createdAt: Date;
}

export interface OrderListView {
  id: string;
  customerId: string;
  companyId: string;
  status: string;
  total: number;
  createdAt: Date;
  customer: {
    id: string;
    name: string | null;
    fullName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  items: OrderListItemView[];
  paymentTransaction: OrderPaymentView | null;
}

/**
 * Caso de uso para listar pedidos por empresa.
 */
@Injectable()
export class GetOrdersByCompanyUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly productRepository: ProductRepository,
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
  ) {}

  async execute(companyId: string): Promise<OrderListView[]> {
    const orders = await this.orderRepository.findAllByCompanyId(companyId);
    const sortedOrders = [...orders].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const orderViews = await Promise.all(
      sortedOrders.map(async (order) => this.buildOrderView(order, companyId)),
    );

    return orderViews;
  }

  private async buildOrderView(
    order: Order,
    companyId: string,
  ): Promise<OrderListView> {
    const [customer, orderItems, paymentTransaction] = await Promise.all([
      this.customerRepository.findById(order.customerId),
      this.orderItemRepository.findByOrderId(order.id),
      this.paymentTransactionRepository.findLatestByOrderId(
        companyId,
        order.id,
      ),
    ]);

    const items: OrderListItemView[] = await Promise.all(
      orderItems.map(async (item) => {
        const product = await this.productRepository.findByIdAndCompanyId(
          item.productId,
          companyId,
        );

        return {
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
          product: product
            ? {
                id: product.id,
                name: product.name,
                description: product.description,
                currency: product.currency,
              }
            : null,
        };
      }),
    );

    return {
      id: order.id,
      customerId: order.customerId,
      companyId: order.companyId,
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            fullName: customer.fullName,
            email: customer.email,
            phone: customer.phone,
          }
        : null,
      items,
      paymentTransaction: paymentTransaction
        ? {
            id: paymentTransaction.id,
            status: paymentTransaction.status,
            provider: paymentTransaction.provider,
            amount: paymentTransaction.amount,
            currency: paymentTransaction.currency,
            mockReference: paymentTransaction.mockReference,
            methodType: paymentTransaction.methodType,
            last4: paymentTransaction.last4,
            brand: paymentTransaction.brand,
            createdAt: paymentTransaction.createdAt,
          }
        : null,
    };
  }
}
