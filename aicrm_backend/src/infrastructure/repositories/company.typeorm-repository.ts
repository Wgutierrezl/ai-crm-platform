import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyRepository } from '../../domain/ports/company.repository.port';
import { Company } from '../../domain/entities/company.entity';
import { CompanyOrmEntity } from '../database/entities/company.orm-entity';

@Injectable()
export class CompanyTypeormRepository implements CompanyRepository {
  constructor(
    @InjectRepository(CompanyOrmEntity)
    private readonly ormRepo: Repository<CompanyOrmEntity>,
  ) {}

  async create(company: Company): Promise<Company> {
    const entity = this.ormRepo.create({
      id: company.id,
      name: company.name,
      createdAt: company.createdAt,
    });
    const saved = await this.ormRepo.save(entity);
    return new Company(saved.id, saved.name, saved.createdAt);
  }

  async findById(id: string): Promise<Company | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    if (!entity) return null;
    return new Company(entity.id, entity.name, entity.createdAt);
  }

  async findAllByCompanyId(_companyId: string): Promise<Company[]> {
    // Company es el agregado raiz; filtrar por companyId no aplica
    return [];
  }
}
