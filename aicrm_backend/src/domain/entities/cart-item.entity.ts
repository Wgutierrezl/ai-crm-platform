export class CartItem {
  constructor(
    public readonly id: string,
    public readonly cartSessionId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly unitPriceSnapshot: number,
    public readonly productNameSnapshot: string,
    public readonly imageUrlSnapshot: string | null,
    public readonly currencySnapshot: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
