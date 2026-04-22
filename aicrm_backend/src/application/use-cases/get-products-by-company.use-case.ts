import { Injectable } from '@nestjs/common';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { Product } from '../../domain/entities/product.entity';

/**
 * Caso de uso para consultar productos de una empresa.
 */
@Injectable()
export class GetProductsByCompanyUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(companyId: string): Promise<Product[]> {
    return this.productRepository.findAllByCompanyId(companyId);
  }
}
