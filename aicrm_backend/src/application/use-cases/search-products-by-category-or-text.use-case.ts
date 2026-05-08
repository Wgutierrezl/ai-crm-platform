import { Injectable } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';

@Injectable()
export class SearchProductsByCategoryOrTextUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    companyId: string,
    query: string,
    limit = 20,
  ): Promise<Product[]> {
    const normalized = query.trim();
    if (!normalized) return [];

    const exactCategory = await this.categoryRepository.findByExactName(
      companyId,
      normalized,
    );
    if (exactCategory) {
      return this.productRepository.findActiveByCategory(
        companyId,
        exactCategory.id,
        limit,
      );
    }

    const relatedCategories = await this.categoryRepository.searchByName(
      companyId,
      normalized,
      3,
    );
    if (relatedCategories.length > 0) {
      const results = await Promise.all(
        relatedCategories.map((category) =>
          this.productRepository.findActiveByCategory(
            companyId,
            category.id,
            Math.max(3, Math.floor(limit / relatedCategories.length)),
          ),
        ),
      );
      const unique = new Map<string, Product>();
      for (const list of results) {
        for (const product of list) unique.set(product.id, product);
      }
      return Array.from(unique.values()).slice(0, limit);
    }

    return this.productRepository.searchByCategoryOrText(companyId, normalized, limit);
  }
}

