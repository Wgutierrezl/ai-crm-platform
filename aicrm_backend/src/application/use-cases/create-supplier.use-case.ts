import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Supplier } from '../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';

export interface CreateSupplierInput {
  companyId: string;
  name: string;
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
export class CreateSupplierUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async execute(input: CreateSupplierInput): Promise<Supplier> {
    const supplier = new Supplier(
      uuidv4(),
      input.companyId,
      input.name.trim(),
      this.normalizeText(input.documentType),
      this.normalizeText(input.documentNumber),
      this.normalizeText(input.contactName),
      this.normalizeText(input.phone),
      this.normalizeText(input.email),
      this.normalizeText(input.address),
      this.normalizeText(input.city),
      this.normalizeText(input.notes),
      input.isActive ?? true,
      new Date(),
      new Date(),
    );

    return this.supplierRepository.create(supplier);
  }

  private normalizeText(value?: string | null): string | null {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}

