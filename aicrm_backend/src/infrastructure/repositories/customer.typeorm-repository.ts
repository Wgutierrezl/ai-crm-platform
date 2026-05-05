import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerOrmEntity } from '../database/entities/customer.orm-entity';

@Injectable()
export class CustomerTypeormRepository implements CustomerRepository {
  private readonly logger = new Logger(CustomerTypeormRepository.name);

  constructor(
    @InjectRepository(CustomerOrmEntity)
    private readonly ormRepo: Repository<CustomerOrmEntity>,
  ) {}

  private toDomain(e: CustomerOrmEntity): Customer {
    return new Customer(
      e.id,
      e.name,
      e.phone,
      e.email,
      e.companyId,
      e.identificationType,
      e.identificationNumber,
    );
  }

  async create(customer: Customer): Promise<Customer> {
    try {
      this.logger.log(
        `Saving customer entity id=${customer.id}, companyId=${customer.companyId}`,
      );
      const entity = this.ormRepo.create({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        companyId: customer.companyId,
        identificationType: customer.identificationType,
        identificationNumber: customer.identificationNumber,
      });
      const saved = await this.ormRepo.save(entity);
      this.logger.log(
        `Customer persisted id=${saved.id}, companyId=${saved.companyId}`,
      );
      return this.toDomain(saved);
    } catch (error) {
      this.logger.error(
        `Error saving customer id=${customer.id}, companyId=${customer.companyId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<Customer | null> {
    try {
      this.logger.log(`Searching customer by id=${id}`);
      const entity = await this.ormRepo.findOneBy({ id });
      if (!entity) {
        this.logger.warn(`Customer not found by id=${id}`);
        return null;
      }
      this.logger.log(`Customer found by id=${id}`);
      return this.toDomain(entity);
    } catch (error) {
      this.logger.error(
        `Error searching customer by id=${id}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findByPhone(
    phone: string,
    companyId: string,
  ): Promise<Customer | null> {
    try {
      this.logger.log(
        `Searching customer by phone=${phone}, companyId=${companyId}`,
      );
      const entity = await this.ormRepo.findOneBy({ phone, companyId });
      if (!entity) {
        this.logger.warn(
          `Customer not found by phone=${phone}, companyId=${companyId}`,
        );
        return null;
      }
      this.logger.log(
        `Customer found by phone=${phone}, companyId=${companyId}`,
      );
      return this.toDomain(entity);
    } catch (error) {
      this.logger.error(
        `Error searching customer by phone=${phone}, companyId=${companyId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async findAllByCompanyId(companyId: string): Promise<Customer[]> {
    try {
      this.logger.log(`Listing customers by companyId=${companyId}`);
      const entities = await this.ormRepo.findBy({ companyId });
      this.logger.log(
        `Customers listed count=${entities.length}, companyId=${companyId}`,
      );
      return entities.map((e) => this.toDomain(e));
    } catch (error) {
      this.logger.error(
        `Error listing customers by companyId=${companyId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
