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
    return new Product(
      e.id,
      e.name,
      e.description ?? null,
      Number(e.price),
      e.stock,
      e.companyId,
      e.isActive,
      e.sku ?? null,
      e.brand ?? null,
      e.featuresJson ?? null,
      e.tagsJson ?? null,
      e.imageUrl ?? null,
      e.currency ?? 'COP',
      e.minStock ?? 0,
      e.metadataJson ?? null,
      e.createdAt,
      e.updatedAt,
    );
  }

  async create(product: Product): Promise<Product> {
    const entity = this.ormRepo.create({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      companyId: product.companyId,
      isActive: product.isActive,
      sku: product.sku,
      brand: product.brand,
      featuresJson: product.features,
      tagsJson: product.tags,
      imageUrl: product.imageUrl,
      currency: product.currency,
      minStock: product.minStock,
      metadataJson: product.metadata,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Product[]> {
    const entities = await this.ormRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findActiveByCompanyId(
    companyId: string,
    limit = 10,
  ): Promise<Product[]> {
    const entities = await this.ormRepo.find({
      where: { companyId, isActive: true },
      order: { stock: 'DESC', createdAt: 'DESC' },
      take: limit,
    });
    return entities.map((e) => this.toDomain(e));
  }

  async searchActiveByCompanyId(
    companyId: string,
    query: string,
    limit = 10,
  ): Promise<Product[]> {
    const q = `%${query.toLowerCase()}%`;
    const entities = await this.ormRepo
      .createQueryBuilder('p')
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(p.name) LIKE :q OR LOWER(COALESCE(p.description, "")) LIKE :q OR LOWER(COALESCE(p.brand, "")) LIKE :q)',
        { q },
      )
      .orderBy('p.stock', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .limit(limit)
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async findByApproximateName(
    companyId: string,
    name: string,
    limit = 5,
  ): Promise<Product[]> {
    const q = `%${name.toLowerCase()}%`;
    const entities = await this.ormRepo
      .createQueryBuilder('p')
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere('LOWER(p.name) LIKE :q', { q })
      .orderBy('p.stock', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .limit(limit)
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async filterByPriceRange(
    companyId: string,
    minPrice: number | null,
    maxPrice: number | null,
    limit = 10,
  ): Promise<Product[]> {
    const qb = this.ormRepo
      .createQueryBuilder('p')
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.isActive = :isActive', { isActive: true });

    if (minPrice !== null) qb.andWhere('p.price >= :minPrice', { minPrice });
    if (maxPrice !== null) qb.andWhere('p.price <= :maxPrice', { maxPrice });

    const entities = await qb
      .orderBy('p.price', 'ASC')
      .addOrderBy('p.stock', 'DESC')
      .limit(limit)
      .getMany();

    return entities.map((e) => this.toDomain(e));
  }
}
