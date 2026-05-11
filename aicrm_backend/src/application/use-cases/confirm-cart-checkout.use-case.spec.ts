import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfirmCartCheckoutUseCase } from './confirm-cart-checkout.use-case';
import { CartSession } from '../../domain/entities/cart-session.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { Product } from '../../domain/entities/product.entity';
import { Category } from '../../domain/entities/category.entity';
import { CartSessionRepository } from '../../domain/ports/cart-session.repository.port';
import { CartItemRepository } from '../../domain/ports/cart-item.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import {
  PaymentProviderPort,
  SimulatePaymentInput,
  SimulatePaymentOutput,
} from '../../domain/ports/payment-provider.port';
import { OrderRepository } from '../../domain/ports/order.repository.port';
import { Order } from '../../domain/entities/order.entity';
import { OrderItemRepository } from '../../domain/ports/order-item.repository.port';
import { OrderItem } from '../../domain/entities/order-item.entity';
import { PaymentTransactionRepository } from '../../domain/ports/payment-transaction.repository.port';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { Customer } from '../../domain/entities/customer.entity';

class InMemoryCustomerRepo extends CustomerRepository {
  customer: Customer | null = null;
  async create(customer: Customer): Promise<Customer> { this.customer = customer; return customer; }
  async update(customer: Customer): Promise<Customer> { this.customer = customer; return customer; }
  async findById(id: string): Promise<Customer | null> {
    if (!this.customer || this.customer.id !== id) return null;
    return this.customer;
  }
  async findByPhone(): Promise<Customer | null> { return null; }
  async findAllByCompanyId(): Promise<Customer[]> { return this.customer ? [this.customer] : []; }
}

class InMemoryCartSessionRepo extends CartSessionRepository {
  session: CartSession | null = null;
  async create(session: CartSession): Promise<CartSession> { this.session = session; return session; }
  async update(session: CartSession): Promise<CartSession> { this.session = session; return session; }
  async findActiveByCustomer(): Promise<CartSession | null> { return this.session?.status === 'active' ? this.session : null; }
  async findByIdAndCompanyId(): Promise<CartSession | null> { return this.session; }
  async transitionStatus(input: { id: string; companyId: string; fromStatus: CartSession['status']; toStatus: CartSession['status']; }): Promise<boolean> {
    if (!this.session) return false;
    if (this.session.id !== input.id || this.session.companyId !== input.companyId) return false;
    if (this.session.status !== input.fromStatus) return false;
    this.session = new CartSession(
      this.session.id,
      this.session.companyId,
      this.session.customerId,
      this.session.conversationId,
      this.session.channel,
      input.toStatus,
      this.session.expiresAt,
      this.session.createdAt,
      new Date(),
    );
    return true;
  }
  async expireOldSessions(): Promise<number> { return 0; }
}

class InMemoryCartItemRepo extends CartItemRepository {
  items: CartItem[] = [];
  async create(item: CartItem): Promise<CartItem> { this.items.push(item); return item; }
  async update(item: CartItem): Promise<CartItem> { this.items = this.items.map((it) => (it.id === item.id ? item : it)); return item; }
  async remove(id: string): Promise<void> { this.items = this.items.filter((it) => it.id !== id); }
  async removeByCartSessionId(cartSessionId: string): Promise<void> { this.items = this.items.filter((it) => it.cartSessionId !== cartSessionId); }
  async findByCartSessionId(cartSessionId: string): Promise<CartItem[]> { return this.items.filter((it) => it.cartSessionId === cartSessionId); }
  async findByCartSessionIdAndProductId(): Promise<CartItem | null> { return null; }
  async findByIdAndCartSessionId(): Promise<CartItem | null> { return null; }
}

class InMemoryProductRepo extends ProductRepository {
  constructor(private readonly product: Product) { super(); }
  async create(product: Product): Promise<Product> { return product; }
  async findById(): Promise<Product | null> { return this.product; }
  async findByIdAndCompanyId(id: string): Promise<Product | null> { return this.product.id === id ? this.product : null; }
  async update(product: Product): Promise<Product> { return product; }
  async findAllByCompanyId(): Promise<Product[]> { return []; }
  async findActiveByCompanyId(): Promise<Product[]> { return []; }
  async searchActiveByCompanyId(): Promise<Product[]> { return []; }
  async findByApproximateName(): Promise<Product[]> { return []; }
  async filterByPriceRange(): Promise<Product[]> { return []; }
  async findActiveByCategory(): Promise<Product[]> { return []; }
  async searchByCategoryOrText(): Promise<Product[]> { return []; }
  async filterByCategoryAndPrice(): Promise<Product[]> { return []; }
}

class InMemoryCategoryRepo extends CategoryRepository {
  constructor(private readonly category: Category) { super(); }
  async create(category: Category): Promise<Category> { return category; }
  async update(category: Category): Promise<Category> { return category; }
  async findById(id: string): Promise<Category | null> { return this.category.id === id ? this.category : null; }
  async findAllByCompanyId(): Promise<Category[]> { return []; }
  async findActiveByCompanyId(): Promise<Category[]> { return []; }
  async findByExactName(): Promise<Category | null> { return null; }
  async searchByName(): Promise<Category[]> { return []; }
}

class FakePaymentProvider extends PaymentProviderPort {
  constructor(private readonly status: SimulatePaymentOutput['status']) { super(); }
  async simulatePayment(input: SimulatePaymentInput): Promise<SimulatePaymentOutput> {
    if (this.status === 'error') throw new Error('controlled');
    return {
      status: this.status,
      provider: 'mock',
      reference: 'MOCK-1',
      amount: input.amount,
      currency: input.currency,
      methodType: 'mock_card',
      last4: '4242',
      brand: 'visa_mock',
      metadata: null,
    };
  }
}

class InMemoryOrderRepo extends OrderRepository {
  orders: Order[] = [];
  async create(order: Order): Promise<Order> { this.orders.push(order); return order; }
  async findById(id: string): Promise<Order | null> {
    return this.orders.find((order) => order.id === id) ?? null;
  }
  async findAllByCompanyId(): Promise<Order[]> { return []; }
}

class InMemoryOrderItemRepo extends OrderItemRepository {
  items: OrderItem[] = [];
  async create(orderItem: OrderItem): Promise<OrderItem> { this.items.push(orderItem); return orderItem; }
  async findById(): Promise<OrderItem | null> { return null; }
  async findAllByCompanyId(): Promise<OrderItem[]> { return []; }
  async findByOrderId(): Promise<OrderItem[]> { return []; }
}

class InMemoryPaymentTxRepo extends PaymentTransactionRepository {
  transactions: PaymentTransaction[] = [];
  async create(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    const duplicate = this.transactions.find(
      (tx) =>
        tx.companyId === transaction.companyId &&
        tx.idempotencyKey === transaction.idempotencyKey,
    );
    if (duplicate) {
      throw new Error('Duplicate entry');
    }
    this.transactions.push(transaction);
    return transaction;
  }
  async update(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    this.transactions = this.transactions.map((tx) => (tx.id === transaction.id ? transaction : tx));
    return transaction;
  }
  async findByIdempotencyKey(companyId: string, idempotencyKey: string): Promise<PaymentTransaction | null> {
    return (
      this.transactions.find(
        (tx) => tx.companyId === companyId && tx.idempotencyKey === idempotencyKey,
      ) ?? null
    );
  }
  async findLatestByCartSessionId(companyId: string, cartSessionId: string): Promise<PaymentTransaction | null> {
    const found = this.transactions.filter(
      (tx) => tx.companyId === companyId && tx.cartSessionId === cartSessionId,
    );
    return found[found.length - 1] ?? null;
  }
}

describe('ConfirmCartCheckoutUseCase', () => {
  const companyId = 'company-1';
  const customerId = 'customer-1';
  const channel = 'whatsapp';
  const sessionId = 'session-1';
  const category = new Category('cat-1', companyId, 'Categoria', null, null, true);
  const product = new Product('p1', 'Producto', null, 50, 10, companyId, true, null, null, null, null, null, 'COP', 0, null, category.id);

  const build = (
    paymentStatus: SimulatePaymentOutput['status'],
    customerEmail = 'ana@example.com',
  ) => {
    const sessionRepo = new InMemoryCartSessionRepo();
    sessionRepo.session = new CartSession(sessionId, companyId, customerId, 'conv-1', channel, 'active', new Date(Date.now() + 100000), new Date(), new Date());
    const itemRepo = new InMemoryCartItemRepo();
    itemRepo.items = [new CartItem('ci-1', sessionId, product.id, 2, product.price, product.name, null, 'COP', new Date(), new Date())];
    const orderRepo = new InMemoryOrderRepo();
    const orderItemRepo = new InMemoryOrderItemRepo();
    const txRepo = new InMemoryPaymentTxRepo();
    const customerRepo = new InMemoryCustomerRepo();
    customerRepo.customer = new Customer(
      customerId,
      'Ana',
      '300',
      customerEmail,
      companyId,
      null,
      null,
      'Ana',
      null,
      'Ana Diaz',
    );
    const transactionalEmailService = {
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    };
    const uc = new ConfirmCartCheckoutUseCase(
      sessionRepo,
      itemRepo,
      new InMemoryProductRepo(product),
      new InMemoryCategoryRepo(category),
      new FakePaymentProvider(paymentStatus),
      orderRepo,
      orderItemRepo,
      txRepo,
      customerRepo,
      transactionalEmailService as any,
    );
    return { uc, sessionRepo, itemRepo, orderRepo, orderItemRepo, txRepo, transactionalEmailService };
  };

  it('creates order and order items on approved mock payment', async () => {
    const { uc, orderRepo, orderItemRepo, itemRepo, sessionRepo } = build('approved');
    const result = await uc.execute({ companyId, customerId, channel });
    expect(result.paymentStatus).toBe('approved');
    expect(orderRepo.orders).toHaveLength(1);
    expect(orderItemRepo.items).toHaveLength(1);
    expect(itemRepo.items).toHaveLength(0);
    expect(sessionRepo.session?.status).toBe('checked_out');
  });

  it('keeps cart and avoids order on rejected payment', async () => {
    const { uc, orderRepo, itemRepo } = build('rejected');
    const result = await uc.execute({ companyId, customerId, channel });
    expect(result.paymentStatus).toBe('rejected');
    expect(orderRepo.orders).toHaveLength(0);
    expect(itemRepo.items).toHaveLength(1);
  });

  it('returns pending without creating order', async () => {
    const { uc, orderRepo } = build('pending');
    const result = await uc.execute({ companyId, customerId, channel });
    expect(result.paymentStatus).toBe('pending');
    expect(orderRepo.orders).toHaveLength(0);
  });

  it('handles controlled payment errors', async () => {
    const { uc, orderRepo } = build('error');
    const result = await uc.execute({ companyId, customerId, channel });
    expect(result.paymentStatus).toBe('error');
    expect(orderRepo.orders).toHaveLength(0);
  });

  it('throws if no active cart', async () => {
    const { uc, sessionRepo } = build('approved');
    sessionRepo.session = null;
    await expect(uc.execute({ companyId, customerId, channel })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws if cart is empty', async () => {
    const { uc, itemRepo } = build('approved');
    itemRepo.items = [];
    await expect(uc.execute({ companyId, customerId, channel })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('is idempotent for repeated confirmation with same idempotency key', async () => {
    const { uc, orderRepo } = build('approved');
    const first = await uc.execute({
      companyId,
      customerId,
      channel,
      idempotencyKey: 'wa:msg:1',
    });
    const second = await uc.execute({
      companyId,
      customerId,
      channel,
      idempotencyKey: 'wa:msg:1',
    });

    expect(first.paymentStatus).toBe('approved');
    expect(second.paymentStatus).toBe('approved');
    expect(orderRepo.orders).toHaveLength(1);
    expect(first.order?.id).toBe(second.order?.id);
  });

  it('sends order confirmation email on approved checkout when customer has email', async () => {
    const { uc, transactionalEmailService } = build('approved', 'ana@example.com');
    await uc.execute({ companyId, customerId, channel });
    expect(transactionalEmailService.sendOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  it('does not fail checkout if email sender throws', async () => {
    const { uc, transactionalEmailService } = build('approved', 'ana@example.com');
    transactionalEmailService.sendOrderConfirmation.mockRejectedValueOnce(
      new Error('smtp down'),
    );
    const result = await uc.execute({ companyId, customerId, channel });
    expect(result.paymentStatus).toBe('approved');
  });

});
