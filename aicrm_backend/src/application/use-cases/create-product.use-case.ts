import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { Product } from '../../domain/entities/product.entity';

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
  companyId: string;
}

/**
 * Caso de uso para crear un producto dentro de una empresa.
 */
@Injectable()
export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    const product = new Product(
      uuidv4(),
      input.name,
      input.price,
      input.stock,
      input.companyId,
    );
    return this.productRepository.create(product);
  }
}
