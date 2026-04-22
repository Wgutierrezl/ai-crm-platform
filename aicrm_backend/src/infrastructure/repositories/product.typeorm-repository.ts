import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { Product } from '../../domain/entities/product.entity';
import { ProductOrmEntity } from '../database/entities/product.orm-entity';

@Injectable()
export class ProductTypeormRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly ormRepo: Repository<ProductOrmEntity>,
  ) {}

  private toDomain(e: ProductOrmEntity): Product {
    return new Product(e.id, e.name, Number(e.price), e.stock, e.companyId);
  }

  async create(product: Product): Promise<Product> {
    const entity = this.ormRepo.create({
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      companyId: product.companyId,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Product[]> {
    const entities = await this.ormRepo.findBy({ companyId });
    return entities.map((e) => this.toDomain(e));
  }
}
