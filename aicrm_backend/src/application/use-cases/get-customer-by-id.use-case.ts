import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { Customer } from '../../domain/entities/customer.entity';

/**
 * Caso de uso para consultar un cliente por ID dentro del tenant autenticado.
 */
@Injectable()
export class GetCustomerByIdUseCase {
  private readonly logger = new Logger(GetCustomerByIdUseCase.name);

  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(customerId: string, companyId: string): Promise<Customer> {
    try {
      this.logger.log(
        `Executing get customer by id=${customerId}, companyId=${companyId}`,
      );

      const customer = await this.customerRepository.findById(customerId);
      if (!customer || customer.companyId !== companyId) {
        this.logger.warn(
          `Customer not found or forbidden id=${customerId}, companyId=${companyId}`,
        );
        throw new NotFoundException('Cliente no encontrado');
      }

      this.logger.log(
        `Customer resolved id=${customer.id}, companyId=${customer.companyId}`,
      );
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Error finding customer by id=${customerId}, companyId=${companyId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
