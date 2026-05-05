import { Injectable, Logger } from '@nestjs/common';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { Customer } from '../../domain/entities/customer.entity';

/**
 * Caso de uso para consultar clientes de una empresa.
 */
@Injectable()
export class GetCustomersByCompanyUseCase {
  private readonly logger = new Logger(GetCustomersByCompanyUseCase.name);

  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(companyId: string): Promise<Customer[]> {
    try {
      this.logger.log(`Executing list customers for companyId=${companyId}`);
      const customers =
        await this.customerRepository.findAllByCompanyId(companyId);
      this.logger.log(
        `Customers found=${customers.length} for companyId=${companyId}`,
      );
      return customers;
    } catch (error) {
      this.logger.error(
        `Error listing customers for companyId=${companyId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
