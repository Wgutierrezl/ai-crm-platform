import { Injectable, NotFoundException } from '@nestjs/common';
import { Supplier } from '../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';

export interface UpdateSupplierStatusInput {
  id: string;
  companyId: string;
  isActive: boolean;
}

@Injectable()
export class UpdateSupplierStatusUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async execute(input: UpdateSupplierStatusInput): Promise<Supplier> {
    const existing = await this.supplierRepository.findByIdAndCompanyId(
      input.id,
      input.companyId,
    );
    if (!existing) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return this.supplierRepository.update(
      new Supplier(
        existing.id,
        existing.companyId,
        existing.name,
        existing.documentType,
        existing.documentNumber,
        existing.contactName,
        existing.phone,
        existing.email,
        existing.address,
        existing.city,
        existing.notes,
        input.isActive,
        existing.createdAt,
        new Date(),
      ),
    );
  }
}

