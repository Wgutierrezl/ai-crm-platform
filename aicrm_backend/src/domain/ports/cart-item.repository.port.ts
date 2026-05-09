import { CartItem } from '../entities/cart-item.entity';

export abstract class CartItemRepository {
  abstract create(item: CartItem): Promise<CartItem>;
  abstract update(item: CartItem): Promise<CartItem>;
  abstract remove(id: string): Promise<void>;
  abstract removeByCartSessionId(cartSessionId: string): Promise<void>;
  abstract findByCartSessionId(cartSessionId: string): Promise<CartItem[]>;
  abstract findByCartSessionIdAndProductId(
    cartSessionId: string,
    productId: string,
  ): Promise<CartItem | null>;
  abstract findByIdAndCartSessionId(
    id: string,
    cartSessionId: string,
  ): Promise<CartItem | null>;
}
