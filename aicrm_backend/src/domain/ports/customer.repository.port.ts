import { Customer } from '../entities/customer.entity';

export abstract class CustomerRepository {
  abstract create(customer: Customer): Promise<Customer>;
  abstract findById(id: string): Promise<Customer | null>;
  abstract findByPhone(
    phone: string,
    companyId: string,
  ): Promise<Customer | null>;
  abstract findAllByCompanyId(companyId: string): Promise<Customer[]>;
}
