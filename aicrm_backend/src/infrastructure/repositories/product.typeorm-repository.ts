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
      e.categoryId ?? null,
      e.createdAt,
      e.updatedAt,
      e.supplierId ?? null,
      e.supplier
        ? {
            id: e.supplier.id,
            name: e.supplier.name,
            isActive: e.supplier.isActive,
          }
        : null,
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
      categoryId: product.categoryId,
      supplierId: product.supplierId,
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

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Product | null> {
    const entity = await this.ormRepo.findOne({ where: { id, companyId } });
    return entity ? this.toDomain(entity) : null;
  }

  async update(product: Product): Promise<Product> {
    const existing = await this.ormRepo.findOne({
      where: { id: product.id, companyId: product.companyId },
    });
    if (!existing) {
      throw new Error('Producto no encontrado para actualizar');
    }

    existing.name = product.name;
    existing.description = product.description;
    existing.price = product.price;
    existing.stock = product.stock;
    existing.isActive = product.isActive;
    existing.sku = product.sku;
    existing.brand = product.brand;
    existing.currency = product.currency;
    existing.minStock = product.minStock;
    existing.imageUrl = product.imageUrl;
    existing.categoryId = product.categoryId;
    existing.supplierId = product.supplierId;
    existing.updatedAt = product.updatedAt;

    const saved = await this.ormRepo.save(existing);
    return this.toDomain(saved);
  }

  async findAllByCompanyId(companyId: string): Promise<Product[]> {
    const entities = await this.ormRepo.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
      relations: { supplier: true },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findAllByCompanyIdAndSupplierId(
    companyId: string,
    supplierId: string,
  ): Promise<Product[]> {
    const entities = await this.ormRepo.find({
      where: { companyId, supplierId },
      order: { createdAt: 'DESC' },
      relations: { supplier: true },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findActiveByCompanyId(
    companyId: string,
    limit = 10,
  ): Promise<Product[]> {
    const entities = await this.ormRepo
      .createQueryBuilder('p')
      .leftJoin(
        'categories',
        'c',
        'c.id = p.category_id AND c.company_id = p.companyId',
      )
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere('(p.category_id IS NULL OR c.is_active = :activeCategory)', {
        activeCategory: true,
      })
      .orderBy('p.stock', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .limit(limit)
      .getMany();
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
      .leftJoin(
        'categories',
        'c',
        'c.id = p.category_id AND c.company_id = p.companyId',
      )
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere('(p.category_id IS NULL OR c.is_active = :activeCategory)', {
        activeCategory: true,
      })
      .andWhere(
        '(LOWER(p.name) LIKE :q OR LOWER(COALESCE(p.description, "")) LIKE :q OR LOWER(COALESCE(p.brand, "")) LIKE :q OR LOWER(COALESCE(p.sku, "")) LIKE :q)',
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
      .leftJoin(
        'categories',
        'c',
        'c.id = p.category_id AND c.company_id = p.companyId',
      )
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere('(p.category_id IS NULL OR c.is_active = :activeCategory)', {
        activeCategory: true,
      })
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
      .leftJoin(
        'categories',
        'c',
        'c.id = p.category_id AND c.company_id = p.companyId',
      )
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere('(p.category_id IS NULL OR c.is_active = :activeCategory)', {
        activeCategory: true,
      });

    if (minPrice !== null) qb.andWhere('p.price >= :minPrice', { minPrice });
    if (maxPrice !== null) qb.andWhere('p.price <= :maxPrice', { maxPrice });

    const entities = await qb
      .orderBy('p.price', 'ASC')
      .addOrderBy('p.stock', 'DESC')
      .limit(limit)
      .getMany();

    return entities.map((e) => this.toDomain(e));
  }

  async findActiveByCategory(
    companyId: string,
    categoryId: string,
    limit = 10,
  ): Promise<Product[]> {
    const entities = await this.ormRepo
      .createQueryBuilder('p')
      .innerJoin(
        'categories',
        'c',
        'c.id = p.category_id AND c.company_id = p.companyId',
      )
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.category_id = :categoryId', { categoryId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere('c.is_active = :activeCategory', { activeCategory: true })
      .orderBy('p.stock', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .limit(limit)
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async searchByCategoryOrText(
    companyId: string,
    query: string,
    limit = 10,
  ): Promise<Product[]> {
    const q = `%${query.toLowerCase()}%`;
    const entities = await this.ormRepo
      .createQueryBuilder('p')
      .leftJoin(
        'categories',
        'c',
        'c.id = p.category_id AND c.company_id = p.companyId',
      )
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere('(p.category_id IS NULL OR c.is_active = :activeCategory)', {
        activeCategory: true,
      })
      .andWhere(
        '(LOWER(p.name) LIKE :q OR LOWER(COALESCE(p.description, "")) LIKE :q OR LOWER(COALESCE(p.brand, "")) LIKE :q OR LOWER(COALESCE(p.sku, "")) LIKE :q OR LOWER(COALESCE(c.name, "")) LIKE :q)',
        { q },
      )
      .orderBy('p.stock', 'DESC')
      .addOrderBy('p.createdAt', 'DESC')
      .limit(limit)
      .getMany();
    return entities.map((e) => this.toDomain(e));
  }

  async filterByCategoryAndPrice(
    companyId: string,
    categoryId: string,
    minPrice: number | null,
    maxPrice: number | null,
    limit = 10,
  ): Promise<Product[]> {
    const qb = this.ormRepo
      .createQueryBuilder('p')
      .innerJoin(
        'categories',
        'c',
        'c.id = p.category_id AND c.company_id = p.companyId',
      )
      .where('p.companyId = :companyId', { companyId })
      .andWhere('p.category_id = :categoryId', { categoryId })
      .andWhere('p.isActive = :isActive', { isActive: true })
      .andWhere('c.is_active = :activeCategory', { activeCategory: true });

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
