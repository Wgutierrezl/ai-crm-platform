import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { Customer } from '../../domain/entities/customer.entity';

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email: string;
  companyId: string;
  identificationType?: string;
  identificationNumber?: string;
}

/**
 * Caso de uso para crear un cliente dentro de una empresa.
 */
@Injectable()
export class CreateCustomerUseCase {
  private readonly logger = new Logger(CreateCustomerUseCase.name);

  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(input: CreateCustomerInput): Promise<Customer> {
    try {
      this.logger.log(
        `Executing create customer for companyId=${input.companyId}, phone=${input.phone}`,
      );

      const customer = new Customer(
        uuidv4(),
        input.name,
        input.phone,
        input.email,
        input.companyId,
        input.identificationType,
        input.identificationNumber,
      );

      const saved = await this.customerRepository.create(customer);
      this.logger.log(`Customer created id=${saved.id}, companyId=${saved.companyId}`);

      return saved;
    } catch (error) {
      this.logger.error(
        `Error creating customer for companyId=${input.companyId}, phone=${input.phone}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
