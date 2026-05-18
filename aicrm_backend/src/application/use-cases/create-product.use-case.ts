import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { Product } from '../../domain/entities/product.entity';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  stock: number;
  companyId: string;
  isActive?: boolean;
  sku?: string;
  brand?: string;
  currency?: string;
  minStock?: number;
  imageUrl?: string;
  categoryId?: string;
  supplierId?: string | null;
}

/**
 * Caso de uso para crear un producto dentro de una empresa.
 */
@Injectable()
export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly supplierRepository: SupplierRepository,
  ) {}

  async execute(input: CreateProductInput): Promise<Product> {
    if (input.supplierId !== undefined && input.supplierId !== null) {
      const supplier = await this.supplierRepository.findByIdAndCompanyId(
        input.supplierId,
        input.companyId,
      );
      if (!supplier) {
        throw new NotFoundException(
          'El proveedor enviado no existe para esta empresa',
        );
      }
    }

    const product = new Product(
      uuidv4(),
      input.name,
      input.description ?? null,
      input.price,
      input.stock,
      input.companyId,
      input.isActive ?? true,
      input.sku ?? null,
      input.brand ?? null,
      null,
      null,
      input.imageUrl ?? null,
      input.currency ?? 'COP',
      input.minStock ?? 0,
      null,
      input.categoryId ?? null,
      new Date(),
      new Date(),
      input.supplierId ?? null,
      null,
    );
    return this.productRepository.create(product);
  }
}
