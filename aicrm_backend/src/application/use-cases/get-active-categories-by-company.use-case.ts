import { Injectable } from '@nestjs/common';
import { Category } from '../../domain/entities/category.entity';
import { CategoryRepository } from '../../domain/ports/category.repository.port';

@Injectable()
export class GetActiveCategoriesByCompanyUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(companyId: string): Promise<Category[]> {
    return this.categoryRepository.findActiveByCompanyId(companyId);
  }
}

