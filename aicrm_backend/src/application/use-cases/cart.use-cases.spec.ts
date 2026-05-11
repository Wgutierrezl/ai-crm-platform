import { AddItemToCartUseCase } from './add-item-to-cart.use-case';
import { ClearCartUseCase } from './clear-cart.use-case';
import { GetOrCreateActiveCartSessionUseCase } from './get-or-create-active-cart-session.use-case';
import { RemoveCartItemUseCase } from './remove-cart-item.use-case';
import { UpdateCartItemQuantityUseCase } from './update-cart-item-quantity.use-case';
import { ViewCartUseCase } from './view-cart.use-case';
import { CartSession } from '../../domain/entities/cart-session.entity';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CartSessionRepository } from '../../domain/ports/cart-session.repository.port';
import { CartItemRepository } from '../../domain/ports/cart-item.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import { Product } from '../../domain/entities/product.entity';
import { Category } from '../../domain/entities/category.entity';

class InMemoryCartSessionRepo extends CartSessionRepository {
  sessions: CartSession[] = [];
  async create(session: CartSession): Promise<CartSession> {
    this.sessions.push(session);
    return session;
  }
  async update(session: CartSession): Promise<CartSession> {
    this.sessions = this.sessions.map((it) => (it.id === session.id ? session : it));
    return session;
  }
  async findActiveByCustomer(companyId: string, customerId: string, channel: string): Promise<CartSession | null> {
    return (
      this.sessions.find(
        (it) =>
          it.companyId === companyId &&
          it.customerId === customerId &&
          it.channel === channel &&
          it.status === 'active',
      ) ?? null
    );
  }
  async findByIdAndCompanyId(id: string, companyId: string): Promise<CartSession | null> {
    return this.sessions.find((it) => it.id === id && it.companyId === companyId) ?? null;
  }
  async transitionStatus(input: {
    id: string;
    companyId: string;
    fromStatus: CartSession['status'];
    toStatus: CartSession['status'];
  }): Promise<boolean> {
    const found = this.sessions.find(
      (it) =>
        it.id === input.id &&
        it.companyId === input.companyId &&
        it.status === input.fromStatus,
    );
    if (!found) return false;
    this.sessions = this.sessions.map((it) =>
      it.id === found.id
        ? new CartSession(
            it.id,
            it.companyId,
            it.customerId,
            it.conversationId,
            it.channel,
            input.toStatus,
            it.expiresAt,
            it.createdAt,
            new Date(),
          )
        : it,
    );
    return true;
  }
  async expireOldSessions(referenceDate: Date): Promise<number> {
    let affected = 0;
    this.sessions = this.sessions.map((it) => {
      if (it.status === 'active' && it.expiresAt <= referenceDate) {
        affected += 1;
        return new CartSession(
          it.id,
          it.companyId,
          it.customerId,
          it.conversationId,
          it.channel,
          'expired',
          it.expiresAt,
          it.createdAt,
          new Date(),
        );
      }
      return it;
    });
    return affected;
  }
}

class InMemoryCartItemRepo extends CartItemRepository {
  items: CartItem[] = [];
  async create(item: CartItem): Promise<CartItem> {
    this.items.push(item);
    return item;
  }
  async update(item: CartItem): Promise<CartItem> {
    this.items = this.items.map((it) => (it.id === item.id ? item : it));
    return item;
  }
  async remove(id: string): Promise<void> {
    this.items = this.items.filter((it) => it.id !== id);
  }
  async removeByCartSessionId(cartSessionId: string): Promise<void> {
    this.items = this.items.filter((it) => it.cartSessionId !== cartSessionId);
  }
  async findByCartSessionId(cartSessionId: string): Promise<CartItem[]> {
    return this.items.filter((it) => it.cartSessionId === cartSessionId);
  }
  async findByCartSessionIdAndProductId(cartSessionId: string, productId: string): Promise<CartItem | null> {
    return this.items.find((it) => it.cartSessionId === cartSessionId && it.productId === productId) ?? null;
  }
  async findByIdAndCartSessionId(id: string, cartSessionId: string): Promise<CartItem | null> {
    return this.items.find((it) => it.id === id && it.cartSessionId === cartSessionId) ?? null;
  }
}

class FakeProductRepo extends ProductRepository {
  constructor(private readonly products: Product[]) {
    super();
  }
  async create(product: Product): Promise<Product> { return product; }
  async findById(id: string): Promise<Product | null> { return this.products.find((p) => p.id === id) ?? null; }
  async findByIdAndCompanyId(id: string, companyId: string): Promise<Product | null> {
    return this.products.find((p) => p.id === id && p.companyId === companyId) ?? null;
  }
  async update(product: Product): Promise<Product> { return product; }
  async findAllByCompanyId(companyId: string): Promise<Product[]> { void companyId; return []; }
  async findActiveByCompanyId(companyId: string, limit?: number): Promise<Product[]> { void companyId; void limit; return []; }
  async searchActiveByCompanyId(companyId: string, query: string, limit?: number): Promise<Product[]> { void companyId; void query; void limit; return []; }
  async findByApproximateName(companyId: string, name: string, limit?: number): Promise<Product[]> { void companyId; void name; void limit; return []; }
  async filterByPriceRange(companyId: string, minPrice: number | null, maxPrice: number | null, limit?: number): Promise<Product[]> { void companyId; void minPrice; void maxPrice; void limit; return []; }
  async findActiveByCategory(companyId: string, categoryId: string, limit?: number): Promise<Product[]> { void companyId; void categoryId; void limit; return []; }
  async searchByCategoryOrText(companyId: string, query: string, limit?: number): Promise<Product[]> { void companyId; void query; void limit; return []; }
  async filterByCategoryAndPrice(companyId: string, categoryId: string, minPrice: number | null, maxPrice: number | null, limit?: number): Promise<Product[]> { void companyId; void categoryId; void minPrice; void maxPrice; void limit; return []; }
}

class FakeCategoryRepo extends CategoryRepository {
  constructor(private readonly categories: Category[]) {
    super();
  }
  async create(category: Category): Promise<Category> { return category; }
  async update(category: Category): Promise<Category> { return category; }
  async findById(id: string, companyId: string): Promise<Category | null> {
    return this.categories.find((c) => c.id === id && c.companyId === companyId) ?? null;
  }
  async findAllByCompanyId(companyId: string): Promise<Category[]> { void companyId; return []; }
  async findActiveByCompanyId(companyId: string): Promise<Category[]> { void companyId; return []; }
  async findByExactName(companyId: string, name: string): Promise<Category | null> { void companyId; void name; return null; }
  async searchByName(companyId: string, query: string, limit?: number): Promise<Category[]> { void companyId; void query; void limit; return []; }
}

describe('Cart use cases', () => {
  const companyId = 'company-1';
  const customerId = 'customer-1';
  const channel = 'whatsapp';
  const conversationId = 'conv-1';
  const categoryId = 'cat-1';
  const product = new Product(
    'product-1',
    'Producto Test',
    'Descripcion',
    100,
    10,
    companyId,
    true,
    null,
    null,
    null,
    null,
    null,
    'COP',
    0,
    null,
    categoryId,
  );
  const category = new Category(categoryId, companyId, 'Categoria', null, null, true);

  it('creates and reuses active cart session', async () => {
    const sessionRepo = new InMemoryCartSessionRepo();
    const getOrCreate = new GetOrCreateActiveCartSessionUseCase(sessionRepo);

    const first = await getOrCreate.execute({ companyId, customerId, channel, conversationId });
    const second = await getOrCreate.execute({ companyId, customerId, channel, conversationId });

    expect(first.id).toBe(second.id);
  });

  it('expires old session and creates a new one', async () => {
    const sessionRepo = new InMemoryCartSessionRepo();
    const old = new CartSession(
      'session-old',
      companyId,
      customerId,
      conversationId,
      channel,
      'active',
      new Date(Date.now() - 1000),
      new Date(Date.now() - 2000),
      new Date(Date.now() - 2000),
    );
    await sessionRepo.create(old);
    const getOrCreate = new GetOrCreateActiveCartSessionUseCase(sessionRepo);

    const created = await getOrCreate.execute({ companyId, customerId, channel, conversationId });
    expect(created.id).not.toBe(old.id);
    expect(sessionRepo.sessions.find((it) => it.id === old.id)?.status).toBe('expired');
  });

  it('adds product and merges quantity for same product', async () => {
    const sessionRepo = new InMemoryCartSessionRepo();
    const itemRepo = new InMemoryCartItemRepo();
    const add = new AddItemToCartUseCase(
      itemRepo,
      new FakeProductRepo([product]),
      new FakeCategoryRepo([category]),
      new GetOrCreateActiveCartSessionUseCase(sessionRepo),
    );

    await add.execute({ companyId, customerId, channel, conversationId, productId: product.id, quantity: 2 });
    const second = await add.execute({ companyId, customerId, channel, conversationId, productId: product.id, quantity: 3 });

    expect(second.quantityMerged).toBe(5);
    expect(itemRepo.items).toHaveLength(1);
  });

  it('updates quantity, removes item and clears cart', async () => {
    const sessionRepo = new InMemoryCartSessionRepo();
    const itemRepo = new InMemoryCartItemRepo();
    const getOrCreate = new GetOrCreateActiveCartSessionUseCase(sessionRepo);
    const add = new AddItemToCartUseCase(
      itemRepo,
      new FakeProductRepo([product]),
      new FakeCategoryRepo([category]),
      getOrCreate,
    );
    const added = await add.execute({ companyId, customerId, channel, conversationId, productId: product.id, quantity: 1 });

    const update = new UpdateCartItemQuantityUseCase(
      itemRepo,
      new FakeProductRepo([product]),
      getOrCreate,
    );
    const updated = await update.execute({ companyId, customerId, channel, conversationId, itemId: added.item.id, quantity: 4 });
    expect(updated.quantity).toBe(4);

    const view = new ViewCartUseCase(getOrCreate, itemRepo);
    const beforeRemove = await view.execute({ companyId, customerId, channel, conversationId });
    expect(beforeRemove.totals.totalItems).toBe(4);

    const remove = new RemoveCartItemUseCase(itemRepo, getOrCreate);
    await remove.execute({ companyId, customerId, channel, conversationId, itemId: added.item.id });
    expect(itemRepo.items).toHaveLength(0);

    await add.execute({ companyId, customerId, channel, conversationId, productId: product.id, quantity: 2 });
    const clear = new ClearCartUseCase(itemRepo, getOrCreate);
    await clear.execute({ companyId, customerId, channel, conversationId });
    expect(itemRepo.items).toHaveLength(0);
  });

  it('keeps cart isolated by tenant', async () => {
    const sessionRepo = new InMemoryCartSessionRepo();
    const itemRepo = new InMemoryCartItemRepo();
    const add = new AddItemToCartUseCase(
      itemRepo,
      new FakeProductRepo([product]),
      new FakeCategoryRepo([category]),
      new GetOrCreateActiveCartSessionUseCase(sessionRepo),
    );

    await add.execute({ companyId, customerId, channel, conversationId, productId: product.id, quantity: 1 });
    await expect(
      add.execute({
        companyId: 'company-2',
        customerId,
        channel,
        conversationId,
        productId: product.id,
        quantity: 1,
      }),
    ).rejects.toThrow();
  });
});
