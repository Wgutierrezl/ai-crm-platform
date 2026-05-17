import { Injectable, NotFoundException } from '@nestjs/common';
import { Supplier } from '../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';

export interface UpdateSupplierInput {
  id: string;
  companyId: string;
  name?: string;
  documentType?: string | null;
  documentNumber?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

@Injectable()
export class UpdateSupplierUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async execute(input: UpdateSupplierInput): Promise<Supplier> {
    const existing = await this.supplierRepository.findByIdAndCompanyId(
      input.id,
      input.companyId,
    );
    if (!existing) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    const updated = new Supplier(
      existing.id,
      existing.companyId,
      input.name !== undefined ? input.name.trim() : existing.name,
      input.documentType === undefined
        ? existing.documentType
        : this.normalizeText(input.documentType),
      input.documentNumber === undefined
        ? existing.documentNumber
        : this.normalizeText(input.documentNumber),
      input.contactName === undefined
        ? existing.contactName
        : this.normalizeText(input.contactName),
      input.phone === undefined ? existing.phone : this.normalizeText(input.phone),
      input.email === undefined ? existing.email : this.normalizeText(input.email),
      input.address === undefined
        ? existing.address
        : this.normalizeText(input.address),
      input.city === undefined ? existing.city : this.normalizeText(input.city),
      input.notes === undefined ? existing.notes : this.normalizeText(input.notes),
      input.isActive ?? existing.isActive,
      existing.createdAt,
      new Date(),
    );

    return this.supplierRepository.update(updated);
  }

  private normalizeText(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}

