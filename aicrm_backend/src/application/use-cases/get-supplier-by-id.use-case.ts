import { Injectable, NotFoundException } from '@nestjs/common';
import { Supplier } from '../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';

@Injectable()
export class GetSupplierByIdUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async execute(id: string, companyId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findByIdAndCompanyId(
      id,
      companyId,
    );
    if (!supplier) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    return supplier;
  }
}

