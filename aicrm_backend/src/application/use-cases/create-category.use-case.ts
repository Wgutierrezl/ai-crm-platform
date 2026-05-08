import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Category } from '../../domain/entities/category.entity';
import { CategoryRepository } from '../../domain/ports/category.repository.port';

export interface CreateCategoryInput {
  companyId: string;
  name: string;
  description?: string;
  slug?: string;
  isActive?: boolean;
}

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const normalizedName = input.name.trim();
    const slug =
      input.slug?.trim() || normalizedName.toLowerCase().replace(/\s+/g, '-');

    const category = new Category(
      uuidv4(),
      input.companyId,
      normalizedName,
      input.description?.trim() || null,
      slug,
      input.isActive ?? true,
      new Date(),
      new Date(),
    );

    return this.categoryRepository.create(category);
  }
}

