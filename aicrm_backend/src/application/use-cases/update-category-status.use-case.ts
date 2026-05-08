import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '../../domain/entities/category.entity';
import { CategoryRepository } from '../../domain/ports/category.repository.port';

export interface UpdateCategoryStatusInput {
  id: string;
  companyId: string;
  isActive: boolean;
}

@Injectable()
export class UpdateCategoryStatusUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: UpdateCategoryStatusInput): Promise<Category> {
    const category = await this.categoryRepository.findById(
      input.id,
      input.companyId,
    );
    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }

    return this.categoryRepository.update(
      new Category(
        category.id,
        category.companyId,
        category.name,
        category.description,
        category.slug,
        input.isActive,
        category.createdAt,
        new Date(),
      ),
    );
  }
}

