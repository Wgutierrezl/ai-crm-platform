import { Category } from '../entities/category.entity';

export abstract class CategoryRepository {
  abstract create(category: Category): Promise<Category>;
  abstract findById(id: string, companyId: string): Promise<Category | null>;
  abstract findAllByCompanyId(companyId: string): Promise<Category[]>;
  abstract findActiveByCompanyId(companyId: string): Promise<Category[]>;
  abstract findByExactName(
    companyId: string,
    name: string,
  ): Promise<Category | null>;
  abstract searchByName(
    companyId: string,
    query: string,
    limit?: number,
  ): Promise<Category[]>;
}

