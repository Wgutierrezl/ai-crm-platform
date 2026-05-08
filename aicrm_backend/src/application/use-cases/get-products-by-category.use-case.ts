import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';

@Injectable()
export class GetProductsByCategoryUseCase {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    companyId: string,
    categoryId: string,
    limit = 20,
  ): Promise<Product[]> {
    const category = await this.categoryRepository.findById(categoryId, companyId);
    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }
    return this.productRepository.findActiveByCategory(companyId, categoryId, limit);
  }
}

