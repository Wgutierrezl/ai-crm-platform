import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CartItemRepository } from '../../domain/ports/cart-item.repository.port';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { GetOrCreateActiveCartSessionUseCase } from './get-or-create-active-cart-session.use-case';

export interface AddItemToCartInput {
  companyId: string;
  customerId: string;
  conversationId?: string | null;
  channel: string;
  productId: string;
  quantity: number;
}

@Injectable()
export class AddItemToCartUseCase {
  constructor(
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly getOrCreateActiveCartSessionUseCase: GetOrCreateActiveCartSessionUseCase,
  ) {}

  async execute(input: AddItemToCartInput): Promise<{
    cartSessionId: string;
    item: CartItem;
    quantityMerged: number;
  }> {
    const quantity = Math.floor(Number(input.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a cero');
    }

    const product = await this.productRepository.findByIdAndCompanyId(
      input.productId,
      input.companyId,
    );
    if (!product || !product.isActive) {
      throw new NotFoundException('Producto no disponible');
    }
    if (product.categoryId) {
      const category = await this.categoryRepository.findById(
        product.categoryId,
        input.companyId,
      );
      if (!category || !category.isActive) {
        throw new NotFoundException(
          'Producto no disponible para catalogo publico',
        );
      }
    }

    if (product.stock < quantity) {
      throw new BadRequestException('No hay stock suficiente para esta cantidad');
    }

    const session = await this.getOrCreateActiveCartSessionUseCase.execute({
      companyId: input.companyId,
      customerId: input.customerId,
      conversationId: input.conversationId ?? null,
      channel: input.channel,
    });

    const existing = await this.cartItemRepository.findByCartSessionIdAndProductId(
      session.id,
      input.productId,
    );
    const mergedQuantity = (existing?.quantity ?? 0) + quantity;
    if (product.stock < mergedQuantity) {
      throw new BadRequestException('No hay stock suficiente para sumar esa cantidad');
    }

    if (existing) {
      const updated = await this.cartItemRepository.update(
        new CartItem(
          existing.id,
          existing.cartSessionId,
          existing.productId,
          mergedQuantity,
          product.price,
          product.name,
          product.imageUrl ?? null,
          product.currency ?? 'COP',
          existing.createdAt,
          new Date(),
        ),
      );
      return {
        cartSessionId: session.id,
        item: updated,
        quantityMerged: mergedQuantity,
      };
    }

    const now = new Date();
    const created = await this.cartItemRepository.create(
      new CartItem(
        uuidv4(),
        session.id,
        product.id,
        quantity,
        product.price,
        product.name,
        product.imageUrl ?? null,
        product.currency ?? 'COP',
        now,
        now,
      ),
    );
    return {
      cartSessionId: session.id,
      item: created,
      quantityMerged: quantity,
    };
  }
}
