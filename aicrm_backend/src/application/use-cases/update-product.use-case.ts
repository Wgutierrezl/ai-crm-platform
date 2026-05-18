import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';

export interface UpdateProductInput {
  id: string;
  companyId: string;
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  sku?: string | null;
  brand?: string | null;
  currency?: string;
  minStock?: number;
  isActive?: boolean;
  imageUrl?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
}

@Injectable()
export class UpdateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly supplierRepository: SupplierRepository,
  ) {}

  async execute(input: UpdateProductInput): Promise<Product> {
    const existing = await this.productRepository.findByIdAndCompanyId(
      input.id,
      input.companyId,
    );
    if (!existing) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = await this.categoryRepository.findById(
        input.categoryId,
        input.companyId,
      );
      if (!category) {
        throw new NotFoundException(
          'La categoria enviada no existe para esta empresa',
        );
      }
    }

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

    const updated = new Product(
      existing.id,
      input.name ?? existing.name,
      input.description === undefined ? existing.description : input.description,
      input.price ?? existing.price,
      input.stock ?? existing.stock,
      existing.companyId,
      input.isActive ?? existing.isActive,
      input.sku === undefined ? existing.sku : input.sku,
      input.brand === undefined ? existing.brand : input.brand,
      existing.features,
      existing.tags,
      input.imageUrl === undefined ? existing.imageUrl : input.imageUrl,
      input.currency ?? existing.currency,
      input.minStock ?? existing.minStock,
      existing.metadata,
      input.categoryId === undefined ? existing.categoryId : input.categoryId,
      existing.createdAt,
      new Date(),
      input.supplierId === undefined ? existing.supplierId : input.supplierId,
      existing.supplier,
    );

    return this.productRepository.update(updated);
  }
}

