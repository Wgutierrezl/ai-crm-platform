import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import { CustomerOrmEntity } from '../database/entities/customer.orm-entity';

@Injectable()
export class CustomerTypeormRepository implements CustomerRepository {
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
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Customer | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Customer[]> {
    const entities = await this.ormRepo.findBy({ companyId });
    return entities.map((e) => this.toDomain(e));
  }
}
