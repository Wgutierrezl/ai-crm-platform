import { Injectable, Logger } from '@nestjs/common';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { Customer } from '../../domain/entities/customer.entity';

/**
 * Caso de uso para buscar cliente por telefono dentro de una empresa.
 * Util para integraciones de canales como WhatsApp.
 */
@Injectable()
export class GetCustomerByPhoneUseCase {
  private readonly logger = new Logger(GetCustomerByPhoneUseCase.name);

  constructor(private readonly customerRepository: CustomerRepository) {}

  async execute(phone: string, companyId: string): Promise<Customer | null> {
    try {
      this.logger.log(
        `Executing get customer by phone=${phone}, companyId=${companyId}`,
      );
      const customer = await this.customerRepository.findByPhone(
        phone,
        companyId,
      );

      if (!customer) {
        this.logger.warn(
          `Customer not found for phone=${phone}, companyId=${companyId}`,
        );
        return null;
      }

      this.logger.log(
        `Customer found id=${customer.id}, companyId=${customer.companyId}`,
      );
      return customer;
    } catch (error) {
      this.logger.error(
        `Error finding customer by phone=${phone}, companyId=${companyId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
