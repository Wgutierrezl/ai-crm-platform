import { Injectable, Logger } from '@nestjs/common';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { WhatsappInteractiveListPayload } from '../../domain/ports/whatsapp-message-sender.port';
import { AddItemToCartUseCase } from '../use-cases/add-item-to-cart.use-case';
import { ClearCartUseCase } from '../use-cases/clear-cart.use-case';
import { ExpireOldCartSessionsUseCase } from '../use-cases/expire-old-cart-sessions.use-case';
import { GetOrCreateActiveCartSessionUseCase } from '../use-cases/get-or-create-active-cart-session.use-case';
import { RemoveCartItemUseCase } from '../use-cases/remove-cart-item.use-case';
import { UpdateCartItemQuantityUseCase } from '../use-cases/update-cart-item-quantity.use-case';
import { ViewCartUseCase } from '../use-cases/view-cart.use-case';

export interface ToolExecutionContext {
  companyId: string;
  customerId?: string;
  conversationId?: string;
  channel?: string;
}

export interface ToolExecutionResult {
  actionExecuted?: string;
  replySuffix?: string;
  botMetadata?: Record<string, unknown>;
}

@Injectable()
export class ToolExecutionService {
  private readonly logger = new Logger(ToolExecutionService.name);
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly getOrCreateActiveCartSessionUseCase: GetOrCreateActiveCartSessionUseCase,
    private readonly addItemToCartUseCase: AddItemToCartUseCase,
    private readonly viewCartUseCase: ViewCartUseCase,
    private readonly updateCartItemQuantityUseCase: UpdateCartItemQuantityUseCase,
    private readonly removeCartItemUseCase: RemoveCartItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly expireOldCartSessionsUseCase: ExpireOldCartSessionsUseCase,
  ) {}

  async execute(
    type: string,
    payload: Record<string, any> | undefined,
    context: ToolExecutionContext,
  ): Promise<ToolExecutionResult> {
    this.logger.log(`[ToolExecution] tool=${type} companyId=${context.companyId} customerId=${context.customerId ?? 'n/a'} channel=${context.channel ?? 'n/a'}`);
    this.logger.debug(`[ToolExecution] payload=${JSON.stringify(payload ?? {})}`);
    if (type === 'CRM_GET_CATEGORIES') {
      const categories = await this.categoryRepository.findActiveByCompanyId(
        context.companyId,
      );
      if (categories.length === 0) {
        return this.empty(
          'Aun no hay categorias activas registradas. Si quieres, puedo mostrarte el catalogo general.',
        );
      }

      return {
        actionExecuted: 'CRM_GET_CATEGORIES',
        replySuffix: this.renderCategories(categories, 'Categorias disponibles:'),
        botMetadata: this.buildInteractiveMetadata({
          header: 'Categorias',
          body: 'Selecciona una categoria para ver productos:',
          buttonText: 'Ver categorias',
          sections: [
            {
              title: 'Catalogo',
              rows: categories.slice(0, 10).map((c) => ({
                id: `category:${c.id}`,
                title: this.truncate(c.name, 24),
                description: this.truncate(
                  c.description ?? 'Ver productos de esta categoria',
                  72,
                ),
              })),
            },
          ],
        }),
      };
    }

    if (type === 'CRM_SEARCH_CATEGORIES') {
      const query = String(payload?.query ?? payload?.name ?? '').trim();
      if (!query) return this.empty('No recibi un termino para buscar categorias.');

      const categories = await this.categoryRepository.searchByName(
        context.companyId,
        this.normalizeCategoryTerm(query),
        this.toLimit(payload?.limit, 10),
      );

      return {
        actionExecuted: 'CRM_SEARCH_CATEGORIES',
        replySuffix:
          categories.length > 0
            ? this.renderCategories(categories, `Categorias relacionadas con "${query}":`)
            : `\n\nNo encontre categorias relacionadas con "${query}".`,
      };
    }

    if (type === 'CRM_GET_CATEGORY_BY_NAME') {
      const name = String(payload?.name ?? '').trim();
      if (!name) return this.empty('No recibi el nombre de categoria para buscar.');

      const exact = await this.categoryRepository.findByExactName(
        context.companyId,
        this.normalizeCategoryTerm(name),
      );
      const categories = exact
        ? [exact]
        : await this.categoryRepository.searchByName(
            context.companyId,
            this.normalizeCategoryTerm(name),
            5,
          );

      return {
        actionExecuted: 'CRM_GET_CATEGORY_BY_NAME',
        replySuffix:
          categories.length > 0
            ? this.renderCategories(categories, `Encontre estas categorias para "${name}":`)
            : `\n\nNo encontre una categoria llamada "${name}".`,
      };
    }

    if (type === 'CRM_GET_PRODUCTS_BY_CATEGORY') {
      const categoryName = String(payload?.category ?? payload?.name ?? '').trim();
      const categoryId = String(payload?.categoryId ?? '').trim();
      const limit = this.toLimit(payload?.limit, 10);

      const category = categoryId
        ? await this.categoryRepository.findById(categoryId, context.companyId)
        : await this.resolveCategory(context.companyId, categoryName);

      if (!category || !category.isActive) {
        const suggestions = await this.categoryRepository.findActiveByCompanyId(
          context.companyId,
        );
        return {
          actionExecuted: 'CRM_GET_PRODUCTS_BY_CATEGORY',
          replySuffix: `\n\nNo encontre esa categoria. Estas son algunas disponibles:\n${suggestions
            .slice(0, 6)
            .map((c) => `- ${c.name}`)
            .join('\n')}`,
        };
      }

      const products = await this.productRepository.findActiveByCategory(
        context.companyId,
        category.id,
        limit,
      );

      return {
        actionExecuted: 'CRM_GET_PRODUCTS_BY_CATEGORY',
        replySuffix:
          products.length > 0
            ? this.renderProducts(products, `Productos en ${category.name}:`)
            : `\n\nNo encontre productos activos en la categoria ${category.name}.`,
        botMetadata:
          products.length > 0
            ? this.buildInteractiveMetadata({
                header: category.name,
                body: `Productos disponibles en ${category.name}:`,
                buttonText: 'Ver productos',
                sections: [
                  {
                    title: 'Resultados',
                    rows: products.slice(0, 10).map((p) => ({
                      id: `product:${p.id}`,
                      title: this.truncate(p.name, 24),
                      description: this.truncate(
                        `${p.currency ?? 'COP'} ${p.price} | Stock ${p.stock}`,
                        72,
                      ),
                    })),
                  },
                ],
              })
            : undefined,
      };
    }

    if (type === 'CRM_GET_PRODUCTS' || type === 'GET_PRODUCTS') {
      const categories = await this.categoryRepository.findActiveByCompanyId(
        context.companyId,
      );
      if (categories.length > 0) {
        return {
          actionExecuted: 'CRM_GET_PRODUCTS',
          replySuffix: this.renderCategories(
            categories,
            'Primero elige una categoria y te muestro productos:',
          ),
          botMetadata: this.buildInteractiveMetadata({
            header: 'Catalogo',
            body: 'Selecciona una categoria para ver productos disponibles:',
            buttonText: 'Ver categorias',
            sections: [
              {
                title: 'Categorias',
                rows: categories.slice(0, 10).map((c) => ({
                  id: `category:${c.id}`,
                  title: this.truncate(c.name, 24),
                  description: this.truncate(
                    c.description ?? 'Ver productos de esta categoria',
                    72,
                  ),
                })),
              },
            ],
          }),
        };
      }

      const limit = this.toLimit(payload?.limit, 10);
      const products = await this.productRepository.findActiveByCompanyId(context.companyId, limit);
      return {
        actionExecuted: 'CRM_GET_PRODUCTS',
        replySuffix: this.renderProducts(products, 'Estos son algunos productos disponibles:'),
      };
    }

    if (type === 'CRM_SEARCH_PRODUCTS') {
      const rawQuery = String(payload?.query ?? '').trim();
      const query = this.normalizeCategoryTerm(rawQuery);
      const limit = this.toLimit(payload?.limit, 10);
      if (!query) return this.empty('No encontre terminos para buscar productos.');

      const category = await this.resolveCategory(context.companyId, query);
      const products = category
        ? await this.productRepository.findActiveByCategory(
            context.companyId,
            category.id,
            limit,
          )
        : await this.productRepository.searchActiveByCompanyId(
            context.companyId,
            query,
            limit,
          );

      const heading = category
        ? `Productos en categoria "${category.name}":`
        : `Resultados para "${rawQuery}":`;

      return {
        actionExecuted: 'CRM_SEARCH_PRODUCTS',
        replySuffix:
          products.length > 0
            ? this.renderProducts(products, heading)
            : `\n\nNo encontre productos para "${rawQuery}". Si quieres, te muestro categorias disponibles.`,
      };
    }

    if (type === 'CRM_GET_PRODUCT_BY_NAME') {
      const name = String(payload?.name ?? '').trim();
      const limit = this.toLimit(payload?.limit, 5);
      if (!name) return this.empty('No recibi el nombre del producto para buscar.');
      const products = await this.productRepository.findByApproximateName(
        context.companyId,
        name,
        limit,
      );
      return {
        actionExecuted: 'CRM_GET_PRODUCT_BY_NAME',
        replySuffix:
          products.length > 0
            ? this.renderProducts(products, `Encontre estas opciones para "${name}":`)
            : `\n\nNo encontre un producto con el nombre "${name}" en este momento.`,
      };
    }

    if (type === 'CRM_FILTER_PRODUCTS_BY_PRICE') {
      const minPrice =
        payload?.minPrice !== undefined ? Number(payload.minPrice) : null;
      const maxPrice =
        payload?.maxPrice !== undefined ? Number(payload.maxPrice) : null;
      const category = await this.resolveCategory(
        context.companyId,
        String(payload?.category ?? '').trim(),
      );
      const limit = this.toLimit(payload?.limit, 10);
      const products = category
        ? await this.productRepository.filterByCategoryAndPrice(
            context.companyId,
            category.id,
            Number.isFinite(minPrice) ? minPrice : null,
            Number.isFinite(maxPrice) ? maxPrice : null,
            limit,
          )
        : await this.productRepository.filterByPriceRange(
            context.companyId,
            Number.isFinite(minPrice) ? minPrice : null,
            Number.isFinite(maxPrice) ? maxPrice : null,
            limit,
          );
      const label = this.renderPriceLabel(minPrice, maxPrice);
      return {
        actionExecuted: 'CRM_FILTER_PRODUCTS_BY_PRICE',
        replySuffix:
          products.length > 0
            ? this.renderProducts(
                products,
                category
                  ? `Productos de ${category.name} ${label}:`
                  : `Productos ${label}:`,
              )
            : `\n\nNo encontre productos ${label}.`,
      };
    }

    if (type === 'CRM_GET_PRODUCT_STOCK') {
      const name = String(payload?.name ?? '').trim();
      const limit = this.toLimit(payload?.limit, 5);
      const products = name
        ? await this.productRepository.findByApproximateName(
            context.companyId,
            name,
            limit,
          )
        : await this.productRepository.findActiveByCompanyId(context.companyId, limit);

      return {
        actionExecuted: 'CRM_GET_PRODUCT_STOCK',
        replySuffix:
          products.length > 0
            ? this.renderStock(products)
            : '\n\nNo encontre productos para consultar disponibilidad.',
      };
    }

    if (type === 'CRM_SEARCH_PRODUCTS_BY_CATEGORY_OR_TEXT') {
      const query = String(payload?.query ?? payload?.term ?? '').trim();
      const limit = this.toLimit(payload?.limit, 10);
      if (!query) return this.empty('No recibi un termino para buscar.');

      const products = await this.productRepository.searchByCategoryOrText(
        context.companyId,
        this.normalizeCategoryTerm(query),
        limit,
      );

      return {
        actionExecuted: 'CRM_SEARCH_PRODUCTS_BY_CATEGORY_OR_TEXT',
        replySuffix:
          products.length > 0
            ? this.renderProducts(products, `Resultados para "${query}":`)
            : `\n\nNo encontre productos relacionados con "${query}".`,
      };
    }

    if (type === 'CRM_GET_PRODUCTS_BY_CATEGORY_AND_PRICE') {
      const category = await this.resolveCategory(
        context.companyId,
        String(payload?.category ?? payload?.name ?? '').trim(),
      );
      const minPrice =
        payload?.minPrice !== undefined ? Number(payload.minPrice) : null;
      const maxPrice =
        payload?.maxPrice !== undefined ? Number(payload.maxPrice) : null;
      const limit = this.toLimit(payload?.limit, 10);

      if (!category) {
        return this.empty(
          'No encontre esa categoria para aplicar el filtro de precio. Si quieres, te muestro categorias disponibles.',
        );
      }

      const products = await this.productRepository.filterByCategoryAndPrice(
        context.companyId,
        category.id,
        Number.isFinite(minPrice) ? minPrice : null,
        Number.isFinite(maxPrice) ? maxPrice : null,
        limit,
      );

      return {
        actionExecuted: 'CRM_GET_PRODUCTS_BY_CATEGORY_AND_PRICE',
        replySuffix:
          products.length > 0
            ? this.renderProducts(
                products,
                `Productos de ${category.name} ${this.renderPriceLabel(minPrice, maxPrice)}:`,
              )
            : `\n\nNo encontre productos de ${category.name} con ese filtro de precio.`,
      };
    }

    if (type === 'CREATE_ORDER' || type === 'CRM_CREATE_ORDER') {
      return {
        actionExecuted: 'CRM_CREATE_ORDER_DISABLED',
        replySuffix:
          '\n\nClaro, puedo ayudarte a revisar el producto y su disponibilidad.\nLa creacion de pedidos estara disponible en una proxima fase.',
      };
    }

    if (type === 'CART_EXPIRE_OLD_SESSIONS') {
      const affected = await this.expireOldCartSessionsUseCase.execute();
      return {
        actionExecuted: 'CART_EXPIRE_OLD_SESSIONS',
        replySuffix: `\n\nSe actualizaron ${affected} carritos expirados.`,
      };
    }

    if (type === 'CART_GET_ACTIVE_SESSION') {
      const cartContext = this.requireCartContext(context);
      const session = await this.getOrCreateActiveCartSessionUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        channel: cartContext.channel,
        conversationId: cartContext.conversationId,
      });
      return {
        actionExecuted: 'CART_GET_ACTIVE_SESSION',
        replySuffix: `\n\nTu carrito esta listo (sesion activa: ${session.id.slice(0, 8)}...).`,
      };
    }

    if (type === 'CART_ADD_ITEM') {
      const cartContext = this.requireCartContext(context);
      const productId = String(payload?.productId ?? '').trim();
      const quantity = Number(payload?.quantity ?? 1);
      if (!productId) return this.empty('No recibi el producto para agregar al carrito.');

      const added = await this.addItemToCartUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        conversationId: cartContext.conversationId,
        channel: cartContext.channel,
        productId,
        quantity,
      });
      return {
        actionExecuted: 'CART_ADD_ITEM',
        replySuffix: `\n\nListo. Agregue "${added.item.productNameSnapshot}" al carrito (cantidad actual: ${added.quantityMerged}).`,
      };
    }

    if (type === 'CART_VIEW') {
      const cartContext = this.requireCartContext(context);
      const cart = await this.viewCartUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        conversationId: cartContext.conversationId,
        channel: cartContext.channel,
      });
      return {
        actionExecuted: 'CART_VIEW',
        replySuffix: this.renderCart(cart.items, cart.totals.subtotal, cart.totals.currency),
      };
    }

    if (type === 'CART_UPDATE_ITEM_QUANTITY') {
      const cartContext = this.requireCartContext(context);
      const itemId = String(payload?.itemId ?? '').trim();
      const quantity = Number(payload?.quantity ?? 0);
      if (!itemId) return this.empty('No recibi el item del carrito a actualizar.');
      const updated = await this.updateCartItemQuantityUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        conversationId: cartContext.conversationId,
        channel: cartContext.channel,
        itemId,
        quantity,
      });
      return {
        actionExecuted: 'CART_UPDATE_ITEM_QUANTITY',
        replySuffix: `\n\nActualice "${updated.productNameSnapshot}" a cantidad ${updated.quantity}.`,
      };
    }

    if (type === 'CART_INCREMENT_ITEM_QUANTITY') {
      const cartContext = this.requireCartContext(context);
      const itemId = String(payload?.itemId ?? '').trim();
      if (!itemId) return this.empty('No recibi el item del carrito a incrementar.');
      const cart = await this.viewCartUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        conversationId: cartContext.conversationId,
        channel: cartContext.channel,
      });
      const item = cart.items.find((it) => it.id === itemId);
      if (!item) return this.empty('No encontre ese item en el carrito.');
      const updated = await this.updateCartItemQuantityUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        conversationId: cartContext.conversationId,
        channel: cartContext.channel,
        itemId,
        quantity: item.quantity + 1,
      });
      return {
        actionExecuted: 'CART_INCREMENT_ITEM_QUANTITY',
        replySuffix: `\n\nAumente "${updated.productNameSnapshot}" a ${updated.quantity}.`,
      };
    }

    if (type === 'CART_DECREMENT_ITEM_QUANTITY') {
      const cartContext = this.requireCartContext(context);
      const itemId = String(payload?.itemId ?? '').trim();
      if (!itemId) return this.empty('No recibi el item del carrito a reducir.');
      const cart = await this.viewCartUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        conversationId: cartContext.conversationId,
        channel: cartContext.channel,
      });
      const item = cart.items.find((it) => it.id === itemId);
      if (!item) return this.empty('No encontre ese item en el carrito.');
      if (item.quantity <= 1) {
        await this.removeCartItemUseCase.execute({
          companyId: context.companyId,
          customerId: cartContext.customerId,
          conversationId: cartContext.conversationId,
          channel: cartContext.channel,
          itemId,
        });
        return {
          actionExecuted: 'CART_DECREMENT_ITEM_QUANTITY',
          replySuffix: '\n\nLa cantidad llego a cero y elimine el item del carrito.',
        };
      }
      const updated = await this.updateCartItemQuantityUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        conversationId: cartContext.conversationId,
        channel: cartContext.channel,
        itemId,
        quantity: item.quantity - 1,
      });
      return {
        actionExecuted: 'CART_DECREMENT_ITEM_QUANTITY',
        replySuffix: `\n\nReduje "${updated.productNameSnapshot}" a ${updated.quantity}.`,
      };
    }

    if (type === 'CART_REMOVE_ITEM') {
      const cartContext = this.requireCartContext(context);
      const itemId = String(payload?.itemId ?? '').trim();
      if (!itemId) return this.empty('No recibi el item del carrito a eliminar.');
      await this.removeCartItemUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        conversationId: cartContext.conversationId,
        channel: cartContext.channel,
        itemId,
      });
      return {
        actionExecuted: 'CART_REMOVE_ITEM',
        replySuffix: '\n\nElimine el item del carrito.',
      };
    }

    if (type === 'CART_CLEAR') {
      const cartContext = this.requireCartContext(context);
      await this.clearCartUseCase.execute({
        companyId: context.companyId,
        customerId: cartContext.customerId,
        conversationId: cartContext.conversationId,
        channel: cartContext.channel,
      });
      return {
        actionExecuted: 'CART_CLEAR',
        replySuffix: '\n\nListo. Tu carrito quedo vacio.',
      };
    }

    return {};
  }

  private requireCartContext(context: ToolExecutionContext): {
    customerId: string;
    conversationId: string | null;
    channel: string;
  } {
    if (!context.customerId || !context.channel) {
      throw new Error('Contexto incompleto para operar carrito');
    }
    return {
      customerId: context.customerId,
      conversationId: context.conversationId ?? null,
      channel: context.channel,
    };
  }

  private async resolveCategory(
    companyId: string,
    input: string,
  ): Promise<{
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
  } | null> {
    const normalized = this.normalizeCategoryTerm(input);
    if (!normalized) return null;

    const found = await this.categoryRepository.searchByName(
      companyId,
      normalized,
      10,
    );
    const exact = found.find(
      (category) => this.normalizeCategoryTerm(category.name) === normalized,
    );
    return exact ?? found[0] ?? null;
  }

  private normalizeCategoryTerm(value: string): string {
    return String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private renderCategories(
    categories: Array<{ name: string; description: string | null }>,
    title: string,
  ): string {
    const lines = categories.map(
      (c, i) => `${i + 1}. ${c.name}${c.description ? `\n   ${c.description}` : ''}`,
    );
    return `\n\n${title}\n\n${lines.join('\n\n')}\n\nSi quieres, te muestro productos de una categoria especifica.`;
  }

  private renderProducts(
    products: Array<{
      name: string;
      price: number;
      stock: number;
      currency?: string;
      brand?: string | null;
      imageUrl?: string | null;
    }>,
    title: string,
  ): string {
    const lines = products.map((p, i) => {
      const currency = p.currency ?? 'COP';
      const brand = p.brand ? ` (${p.brand})` : '';
      const imageLine = p.imageUrl ? `\nImagen: ${p.imageUrl}` : '';
      return `${i + 1}. ${p.name}${brand}\nPrecio: ${currency} ${p.price}\nStock: ${p.stock}${imageLine}`;
    });
    return `\n\n${title}\n\n${lines.join('\n\n')}\n\nQuieres que te filtre por precio, categoria o marca?`;
  }

  private renderStock(
    products: Array<{
      name: string;
      stock: number;
      price: number;
      currency?: string;
    }>,
  ): string {
    const lines = products.map(
      (p) =>
        `- ${p.name}: ${p.stock} unidades | ${p.currency ?? 'COP'} ${p.price}`,
    );
    return `\n\nDisponibilidad actual:\n${lines.join('\n')}`;
  }

  private renderCart(
    items: Array<{
      id: string;
      productNameSnapshot: string;
      quantity: number;
      unitPriceSnapshot: number;
      currencySnapshot: string;
    }>,
    subtotal: number,
    currency: string,
  ): string {
    if (items.length === 0) {
      return '\n\nTu carrito esta vacio.\nPuedes agregar productos desde el catalogo.';
    }
    const lines = items.map(
      (item, i) =>
        `${i + 1}. ${item.productNameSnapshot}\nCantidad: ${item.quantity}\nPrecio unidad: ${item.currencySnapshot} ${item.unitPriceSnapshot}\nItemId: ${item.id}`,
    );
    return `\n\nCarrito actual:\n\n${lines.join('\n\n')}\n\nSubtotal: ${currency} ${subtotal}\n\nPuedes decirme: actualizar cantidad, eliminar item o limpiar carrito.`;
  }

  private renderPriceLabel(min: number | null, max: number | null): string {
    if (min !== null && max !== null) return `entre ${min} y ${max}`;
    if (min !== null) return `mayores a ${min}`;
    if (max !== null) return `menores a ${max}`;
    return 'por precio solicitado';
  }

  private toLimit(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(20, Math.floor(parsed));
  }

  private empty(message: string): ToolExecutionResult {
    return { actionExecuted: 'NOOP', replySuffix: `\n\n${message}` };
  }

  private buildInteractiveMetadata(payload: WhatsappInteractiveListPayload): Record<string, unknown> {
    return {
      whatsapp_interactive_list: payload,
    };
  }

  private truncate(value: string, max: number): string {
    if (value.length <= max) return value;
    return `${value.slice(0, Math.max(0, max - 1))}...`;
  }
}

