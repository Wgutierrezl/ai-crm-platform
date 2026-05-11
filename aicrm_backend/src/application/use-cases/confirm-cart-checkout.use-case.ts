import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CartSession } from '../../domain/entities/cart-session.entity';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';
import {
  PaymentProviderPort,
  PaymentSimulationScenario,
} from '../../domain/ports/payment-provider.port';
import { CartItemRepository } from '../../domain/ports/cart-item.repository.port';
import { CartSessionRepository } from '../../domain/ports/cart-session.repository.port';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import { OrderItemRepository } from '../../domain/ports/order-item.repository.port';
import { OrderRepository } from '../../domain/ports/order.repository.port';
import { PaymentTransactionRepository } from '../../domain/ports/payment-transaction.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';

export interface ConfirmCartCheckoutInput {
  companyId: string;
  customerId: string;
  conversationId?: string | null;
  channel: string;
  paymentScenario?: PaymentSimulationScenario;
}

export interface ConfirmCartCheckoutOutput {
  paymentStatus: 'approved' | 'rejected' | 'pending' | 'error';
  order: Order | null;
  orderItems: OrderItem[];
  paymentTransaction: PaymentTransaction | null;
}

@Injectable()
export class ConfirmCartCheckoutUseCase {
  constructor(
    private readonly cartSessionRepository: CartSessionRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly paymentProvider: PaymentProviderPort,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
  ) {}

  async execute(input: ConfirmCartCheckoutInput): Promise<ConfirmCartCheckoutOutput> {
    const session = await this.cartSessionRepository.findActiveByCustomer(
      input.companyId,
      input.customerId,
      input.channel,
    );
    if (!session) {
      throw new NotFoundException('No hay carrito activo para confirmar.');
    }

    const items = await this.cartItemRepository.findByCartSessionId(session.id);
    if (items.length === 0) {
      throw new BadRequestException('Tu carrito esta vacio.');
    }

    for (const item of items) {
      const product = await this.productRepository.findByIdAndCompanyId(
        item.productId,
        input.companyId,
      );
      if (!product || !product.isActive) {
        throw new BadRequestException('Hay productos inactivos en el carrito.');
      }
      if (product.categoryId) {
        const category = await this.categoryRepository.findById(
          product.categoryId,
          input.companyId,
        );
        if (!category || !category.isActive) {
          throw new BadRequestException('Hay productos con categoria inactiva.');
        }
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `No hay stock suficiente para ${item.productNameSnapshot}.`,
        );
      }
    }

    const amount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceSnapshot,
      0,
    );
    const currency = items[0]?.currencySnapshot ?? 'COP';

    try {
      const payment = await this.paymentProvider.simulatePayment({
        companyId: input.companyId,
        customerId: input.customerId,
        amount,
        currency,
        scenario: input.paymentScenario ?? 'approved',
      });

      if (payment.status !== 'approved') {
        const tx = await this.paymentTransactionRepository.create(
          new PaymentTransaction(
            uuidv4(),
            input.companyId,
            input.customerId,
            null,
            payment.provider,
            payment.status,
            payment.amount,
            payment.currency,
            payment.reference,
            payment.methodType,
            payment.last4,
            payment.brand,
            payment.metadata,
            new Date(),
            new Date(),
          ),
        );
        return {
          paymentStatus: payment.status,
          order: null,
          orderItems: [],
          paymentTransaction: tx,
        };
      }

      const createdOrder = await this.orderRepository.create(
        new Order(
          uuidv4(),
          input.customerId,
          input.companyId,
          'mock_paid',
          amount,
          new Date(),
        ),
      );
      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const created = await this.orderItemRepository.create(
          new OrderItem(
            uuidv4(),
            createdOrder.id,
            item.productId,
            input.companyId,
            item.quantity,
            item.unitPriceSnapshot,
          ),
        );
        orderItems.push(created);
      }

      const tx = await this.paymentTransactionRepository.create(
        new PaymentTransaction(
          uuidv4(),
          input.companyId,
          input.customerId,
          createdOrder.id,
          payment.provider,
          payment.status,
          payment.amount,
          payment.currency,
          payment.reference,
          payment.methodType,
          payment.last4,
          payment.brand,
          payment.metadata,
          new Date(),
          new Date(),
        ),
      );

      await this.cartItemRepository.removeByCartSessionId(session.id);
      await this.cartSessionRepository.update(
        new CartSession(
          session.id,
          session.companyId,
          session.customerId,
          session.conversationId,
          session.channel,
          'checked_out',
          session.expiresAt,
          session.createdAt,
          new Date(),
        ),
      );

      return {
        paymentStatus: 'approved',
        order: createdOrder,
        orderItems,
        paymentTransaction: tx,
      };
    } catch (error) {
      const tx = await this.paymentTransactionRepository.create(
        new PaymentTransaction(
          uuidv4(),
          input.companyId,
          input.customerId,
          null,
          'mock',
          'error',
          amount,
          currency,
          `MOCK-ERR-${uuidv4().slice(0, 8).toUpperCase()}`,
          'mock_card',
          '4242',
          'visa_mock',
          {
            message: error instanceof Error ? error.message : 'unknown',
          },
          new Date(),
          new Date(),
        ),
      );
      return {
        paymentStatus: 'error',
        order: null,
        orderItems: [],
        paymentTransaction: tx,
      };
    }
  }
}
