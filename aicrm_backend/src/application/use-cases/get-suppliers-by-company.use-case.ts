import { Injectable } from '@nestjs/common';
import { Supplier } from '../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';

@Injectable()
export class GetSuppliersByCompanyUseCase {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async execute(companyId: string): Promise<Supplier[]> {
    return this.supplierRepository.findAllByCompanyId(companyId);
  }
}

