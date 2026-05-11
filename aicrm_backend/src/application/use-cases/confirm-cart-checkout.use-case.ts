import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
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
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { TransactionalEmailService } from '../services/transactional-email.service';

export interface ConfirmCartCheckoutInput {
  companyId: string;
  customerId: string;
  conversationId?: string | null;
  channel: string;
  paymentScenario?: PaymentSimulationScenario;
  idempotencyKey?: string;
}

export interface ConfirmCartCheckoutOutput {
  paymentStatus: 'approved' | 'rejected' | 'pending' | 'error';
  order: Order | null;
  orderItems: OrderItem[];
  paymentTransaction: PaymentTransaction | null;
}

@Injectable()
export class ConfirmCartCheckoutUseCase {
  private readonly logger = new Logger(ConfirmCartCheckoutUseCase.name);

  constructor(
    private readonly cartSessionRepository: CartSessionRepository,
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly paymentProvider: PaymentProviderPort,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly transactionalEmailService: TransactionalEmailService,
  ) {}

  async execute(input: ConfirmCartCheckoutInput): Promise<ConfirmCartCheckoutOutput> {
    if (input.idempotencyKey?.trim()) {
      const previous = await this.paymentTransactionRepository.findByIdempotencyKey(
        input.companyId,
        input.idempotencyKey.trim(),
      );
      if (previous) {
        return this.buildOutputFromExistingTransaction(previous);
      }
    }

    const session = await this.cartSessionRepository.findActiveByCustomer(
      input.companyId,
      input.customerId,
      input.channel,
    );
    if (!session) {
      throw new NotFoundException('No hay carrito activo para confirmar.');
    }
    const checkoutIdempotencyKey =
      input.idempotencyKey?.trim() || this.buildCheckoutIdempotencyKey(session.id);
    const existingCheckout = await this.paymentTransactionRepository.findByIdempotencyKey(
      input.companyId,
      checkoutIdempotencyKey,
    );
    if (existingCheckout) {
      return this.buildOutputFromExistingTransaction(existingCheckout);
    }

    const checkoutLockAcquired = await this.cartSessionRepository.transitionStatus({
      id: session.id,
      companyId: session.companyId,
      fromStatus: 'active',
      toStatus: 'checkout_pending',
    });
    if (!checkoutLockAcquired) {
      const latest = await this.paymentTransactionRepository.findLatestByCartSessionId(
        input.companyId,
        session.id,
      );
      if (latest) return this.buildOutputFromExistingTransaction(latest);
      return {
        paymentStatus: 'pending',
        order: null,
        orderItems: [],
        paymentTransaction: null,
      };
    }

    const items = await this.cartItemRepository.findByCartSessionId(session.id);
    if (items.length === 0) {
      await this.cartSessionRepository.transitionStatus({
        id: session.id,
        companyId: session.companyId,
        fromStatus: 'checkout_pending',
        toStatus: 'active',
      });
      throw new BadRequestException('Tu carrito esta vacio.');
    }

    for (const item of items) {
      const product = await this.productRepository.findByIdAndCompanyId(
        item.productId,
        input.companyId,
      );
      if (!product || !product.isActive) {
        await this.cartSessionRepository.transitionStatus({
          id: session.id,
          companyId: session.companyId,
          fromStatus: 'checkout_pending',
          toStatus: 'active',
        });
        throw new BadRequestException('Hay productos inactivos en el carrito.');
      }
      if (product.categoryId) {
        const category = await this.categoryRepository.findById(
          product.categoryId,
          input.companyId,
        );
        if (!category || !category.isActive) {
          await this.cartSessionRepository.transitionStatus({
            id: session.id,
            companyId: session.companyId,
            fromStatus: 'checkout_pending',
            toStatus: 'active',
          });
          throw new BadRequestException('Hay productos con categoria inactiva.');
        }
      }
      if (product.stock < item.quantity) {
        await this.cartSessionRepository.transitionStatus({
          id: session.id,
          companyId: session.companyId,
          fromStatus: 'checkout_pending',
          toStatus: 'active',
        });
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
        const tx = await this.createOrGetTransactionSafely(
          new PaymentTransaction(
            uuidv4(),
            input.companyId,
            input.customerId,
            session.id,
            null,
            checkoutIdempotencyKey,
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
        await this.cartSessionRepository.transitionStatus({
          id: session.id,
          companyId: session.companyId,
          fromStatus: 'checkout_pending',
          toStatus: 'active',
        });
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

      const tx = await this.createOrGetTransactionSafely(
        new PaymentTransaction(
          uuidv4(),
          input.companyId,
          input.customerId,
          session.id,
          createdOrder.id,
          checkoutIdempotencyKey,
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
      await this.cartSessionRepository.transitionStatus({
        id: session.id,
        companyId: session.companyId,
        fromStatus: 'checkout_pending',
        toStatus: 'checked_out',
      });
      try {
        const customer = await this.customerRepository.findById(input.customerId);
        await this.transactionalEmailService.sendOrderConfirmation({
          companyId: input.companyId,
          customer,
          orderId: createdOrder.id,
          orderDate: createdOrder.createdAt,
          total: createdOrder.total,
          currency,
          paymentStatus: tx.status,
          paymentReference: tx.mockReference,
          items: items.map((item) => ({
            productName: item.productNameSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPriceSnapshot,
            currency: item.currencySnapshot,
          })),
        });
      } catch (error) {
        this.logger.error(
          `No se pudo enviar correo de confirmacion orderId=${createdOrder.id}: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }

      return {
        paymentStatus: 'approved',
        order: createdOrder,
        orderItems,
        paymentTransaction: tx,
      };
    } catch (error) {
      const tx = await this.createOrGetTransactionSafely(
        new PaymentTransaction(
          uuidv4(),
          input.companyId,
          input.customerId,
          session.id,
          null,
          checkoutIdempotencyKey,
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
      await this.cartSessionRepository.transitionStatus({
        id: session.id,
        companyId: session.companyId,
        fromStatus: 'checkout_pending',
        toStatus: 'active',
      });
      return {
        paymentStatus: 'error',
        order: null,
        orderItems: [],
        paymentTransaction: tx,
      };
    }
  }

  private buildCheckoutIdempotencyKey(cartSessionId: string): string {
    return `checkout:${cartSessionId}:confirm`;
  }

  private async buildOutputFromExistingTransaction(
    tx: PaymentTransaction,
  ): Promise<ConfirmCartCheckoutOutput> {
    if (tx.orderId) {
      const existingOrder = await this.orderRepository.findById(tx.orderId);
      const existingItems = existingOrder
        ? await this.orderItemRepository.findByOrderId(existingOrder.id)
        : [];
      return {
        paymentStatus: 'approved',
        order: existingOrder,
        orderItems: existingItems,
        paymentTransaction: tx,
      };
    }
    return {
      paymentStatus: tx.status,
      order: null,
      orderItems: [],
      paymentTransaction: tx,
    };
  }

  private async createOrGetTransactionSafely(
    transaction: PaymentTransaction,
  ): Promise<PaymentTransaction> {
    try {
      return await this.paymentTransactionRepository.create(transaction);
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;
      const existing = await this.paymentTransactionRepository.findByIdempotencyKey(
        transaction.companyId,
        transaction.idempotencyKey,
      );
      if (existing) return existing;
      throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): boolean {
    const message = String((error as { message?: string })?.message ?? '').toLowerCase();
    return message.includes('duplicate') || message.includes('duplicate entry');
  }
}
