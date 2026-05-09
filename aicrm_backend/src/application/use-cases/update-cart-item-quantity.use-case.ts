import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartItem } from '../../domain/entities/cart-item.entity';
import { CartItemRepository } from '../../domain/ports/cart-item.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { GetOrCreateActiveCartSessionUseCase } from './get-or-create-active-cart-session.use-case';

export interface UpdateCartItemQuantityInput {
  companyId: string;
  customerId: string;
  conversationId?: string | null;
  channel: string;
  itemId: string;
  quantity: number;
}

@Injectable()
export class UpdateCartItemQuantityUseCase {
  constructor(
    private readonly cartItemRepository: CartItemRepository,
    private readonly productRepository: ProductRepository,
    private readonly getOrCreateActiveCartSessionUseCase: GetOrCreateActiveCartSessionUseCase,
  ) {}

  async execute(input: UpdateCartItemQuantityInput): Promise<CartItem> {
    const quantity = Math.floor(Number(input.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a cero');
    }

    const session = await this.getOrCreateActiveCartSessionUseCase.execute({
      companyId: input.companyId,
      customerId: input.customerId,
      conversationId: input.conversationId ?? null,
      channel: input.channel,
    });

    const item = await this.cartItemRepository.findByIdAndCartSessionId(
      input.itemId,
      session.id,
    );
    if (!item) {
      throw new NotFoundException('Item de carrito no encontrado');
    }

    const product = await this.productRepository.findByIdAndCompanyId(
      item.productId,
      input.companyId,
    );
    if (!product || !product.isActive) {
      throw new NotFoundException('Producto no disponible para actualizar item');
    }
    if (product.stock < quantity) {
      throw new BadRequestException('No hay stock suficiente para esa cantidad');
    }

    return this.cartItemRepository.update(
      new CartItem(
        item.id,
        item.cartSessionId,
        item.productId,
        quantity,
        item.unitPriceSnapshot,
        item.productNameSnapshot,
        item.imageUrlSnapshot,
        item.currencySnapshot,
        item.createdAt,
        new Date(),
      ),
    );
  }
}
