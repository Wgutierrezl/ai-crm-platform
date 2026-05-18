import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';

@Injectable()
export class GetProductsBySupplierUseCase {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(companyId: string, supplierId: string): Promise<Product[]> {
    const supplier = await this.supplierRepository.findByIdAndCompanyId(
      supplierId,
      companyId,
    );
    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return this.productRepository.findAllByCompanyIdAndSupplierId(
      companyId,
      supplierId,
    );
  }
}

