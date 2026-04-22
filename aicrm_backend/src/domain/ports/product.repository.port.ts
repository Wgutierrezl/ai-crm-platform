import { Product } from '../entities/product.entity';

export abstract class ProductRepository {
  abstract create(product: Product): Promise<Product>;
  abstract findById(id: string): Promise<Product | null>;
  abstract findAllByCompanyId(companyId: string): Promise<Product[]>;
}
