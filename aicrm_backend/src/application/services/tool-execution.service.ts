import { Injectable } from '@nestjs/common';
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
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(
    type: string,
    payload: Record<string, any> | undefined,
    context: ToolExecutionContext,
  ): Promise<ToolExecutionResult> {
    if (type === 'CRM_GET_PRODUCTS' || type === 'GET_PRODUCTS') {
      const limit = this.toLimit(payload?.limit, 10);
      const products = await this.productRepository.findActiveByCompanyId(
        context.companyId,
        limit,
      );
      return {
        actionExecuted: 'CRM_GET_PRODUCTS',
        replySuffix: this.renderProducts(products, 'Estos son algunos productos disponibles:'),
      };
    }

    if (type === 'CRM_SEARCH_PRODUCTS') {
      const query = String(payload?.query ?? '').trim();
      const limit = this.toLimit(payload?.limit, 10);
      if (!query) return this.empty('No encontré términos para buscar productos 😕');
      const products = await this.productRepository.searchActiveByCompanyId(
        context.companyId,
        query,
        limit,
      );
      return {
        actionExecuted: 'CRM_SEARCH_PRODUCTS',
        replySuffix:
          products.length > 0
            ? this.renderProducts(products, `Resultados para "${query}":`)
            : `\n\nNo encontré productos relacionados con "${query}" 😕.\nPuedo mostrarte el catálogo completo o buscar otra categoría.`,
      };
    }

    if (type === 'CRM_GET_PRODUCT_BY_NAME') {
      const name = String(payload?.name ?? '').trim();
      const limit = this.toLimit(payload?.limit, 5);
      if (!name) return this.empty('No recibí el nombre del producto para buscar.');
      const products = await this.productRepository.findByApproximateName(
        context.companyId,
        name,
        limit,
      );
      return {
        actionExecuted: 'CRM_GET_PRODUCT_BY_NAME',
        replySuffix:
          products.length > 0
            ? this.renderProducts(products, `Encontré estas opciones para "${name}":`)
            : `\n\nNo encontré un producto con el nombre "${name}" en este momento.`,
      };
    }

    if (type === 'CRM_FILTER_PRODUCTS_BY_PRICE') {
      const minPrice =
        payload?.minPrice !== undefined ? Number(payload.minPrice) : null;
      const maxPrice =
        payload?.maxPrice !== undefined ? Number(payload.maxPrice) : null;
      const limit = this.toLimit(payload?.limit, 10);
      const products = await this.productRepository.filterByPriceRange(
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
            ? this.renderProducts(products, `Productos ${label}:`)
            : `\n\nNo encontré productos ${label} 😕`,
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
            : '\n\nNo encontré productos para consultar disponibilidad.',
      };
    }

    if (type === 'CREATE_ORDER' || type === 'CRM_CREATE_ORDER') {
      return {
        actionExecuted: 'CRM_CREATE_ORDER_DISABLED',
        replySuffix:
          '\n\nClaro 😊 Puedo ayudarte a revisar el producto y su disponibilidad.\nLa creación de pedidos estará disponible en una próxima fase.',
      };
    }

    return {};
  }

  private renderProducts(
    products: Array<{
      name: string;
      price: number;
      stock: number;
      currency?: string;
      brand?: string | null;
    }>,
    title: string,
  ): string {
    const lines = products.map((p, i) => {
      const currency = p.currency ?? 'COP';
      const brand = p.brand ? ` (${p.brand})` : '';
      return `${i + 1}. ${p.name}${brand}\n💰 ${currency} ${p.price}\n📦 Stock: ${p.stock}`;
    });
    return `\n\n${title}\n\n${lines.join('\n\n')}\n\n¿Quieres que te filtre por precio, categoría o marca?`;
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
        `- ${p.name}: 📦 ${p.stock} unidades | 💰 ${p.currency ?? 'COP'} ${p.price}`,
    );
    return `\n\nDisponibilidad actual:\n${lines.join('\n')}`;
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
}
