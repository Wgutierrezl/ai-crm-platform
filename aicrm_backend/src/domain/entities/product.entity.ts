export class Product {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly price: number,
    public readonly stock: number,
    public readonly companyId: string,
    public readonly isActive: boolean = true,
    public readonly sku: string | null = null,
    public readonly brand: string | null = null,
    public readonly features: Record<string, unknown> | null = null,
    public readonly tags: string[] | null = null,
    public readonly imageUrl: string | null = null,
    public readonly currency: string = 'COP',
    public readonly minStock: number = 0,
    public readonly metadata: Record<string, unknown> | null = null,
    public readonly categoryId: string | null = null,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}
