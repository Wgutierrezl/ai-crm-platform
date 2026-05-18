import { Supplier } from '../entities/supplier.entity';

export abstract class SupplierRepository {
  abstract create(supplier: Supplier): Promise<Supplier>;
  abstract update(supplier: Supplier): Promise<Supplier>;
  abstract findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Supplier | null>;
  abstract findAllByCompanyId(companyId: string): Promise<Supplier[]>;
}

