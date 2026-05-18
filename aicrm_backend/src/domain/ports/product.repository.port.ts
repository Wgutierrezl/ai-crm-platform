import { Product } from '../entities/product.entity';

export abstract class ProductRepository {
  abstract create(product: Product): Promise<Product>;
  abstract findById(id: string): Promise<Product | null>;
  abstract findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Product | null>;
  abstract update(product: Product): Promise<Product>;
  abstract findAllByCompanyId(companyId: string): Promise<Product[]>;
  abstract findAllByCompanyIdAndSupplierId(
    companyId: string,
    supplierId: string,
  ): Promise<Product[]>;
  abstract findActiveByCompanyId(
    companyId: string,
    limit?: number,
  ): Promise<Product[]>;
  abstract searchActiveByCompanyId(
    companyId: string,
    query: string,
    limit?: number,
  ): Promise<Product[]>;
  abstract findByApproximateName(
    companyId: string,
    name: string,
    limit?: number,
  ): Promise<Product[]>;
  abstract filterByPriceRange(
    companyId: string,
    minPrice: number | null,
    maxPrice: number | null,
    limit?: number,
  ): Promise<Product[]>;
  abstract findActiveByCategory(
    companyId: string,
    categoryId: string,
    limit?: number,
  ): Promise<Product[]>;
  abstract searchByCategoryOrText(
    companyId: string,
    query: string,
    limit?: number,
  ): Promise<Product[]>;
  abstract filterByCategoryAndPrice(
    companyId: string,
    categoryId: string,
    minPrice: number | null,
    maxPrice: number | null,
    limit?: number,
  ): Promise<Product[]>;
}
