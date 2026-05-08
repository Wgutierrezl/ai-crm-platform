import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryRepository } from '../../domain/ports/category.repository.port';
import { Category } from '../../domain/entities/category.entity';
import { CategoryOrmEntity } from '../database/entities/category.orm-entity';

@Injectable()
export class CategoryTypeormRepository implements CategoryRepository {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    private readonly ormRepo: Repository<CategoryOrmEntity>,
  ) {}

  private toDomain(entity: CategoryOrmEntity): Category {
    return new Category(
      entity.id,
      entity.companyId,
      entity.name,
      entity.description ?? null,
      entity.slug ?? null,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(category: Category): Promise<Category> {
    const saved = await this.ormRepo.save(
      this.ormRepo.create({
        id: category.id,
        companyId: category.companyId,
        name: category.name,
        description: category.description,
        slug: category.slug,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      }),
    );
    return this.toDomain(saved);
  }

  async update(category: Category): Promise<Category> {
    const existing = await this.ormRepo.findOne({
      where: { id: category.id, companyId: category.companyId },
    });
    if (!existing) {
      throw new Error('Categoria no encontrada para actualizar');
    }

    existing.name = category.name;
    existing.description = category.description;
    existing.slug = category.slug;
    existing.isActive = category.isActive;
    existing.updatedAt = category.updatedAt;

    const saved = await this.ormRepo.save(existing);
    return this.toDomain(saved);
  }

  async findById(id: string, companyId: string): Promise<Category | null> {
    const entity = await this.ormRepo.findOne({ where: { id, companyId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Category[]> {
    const entities = await this.ormRepo.find({
      where: { companyId },
      order: { name: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findActiveByCompanyId(companyId: string): Promise<Category[]> {
    const entities = await this.ormRepo.find({
      where: { companyId, isActive: true },
      order: { name: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }

  async findByExactName(
    companyId: string,
    name: string,
  ): Promise<Category | null> {
    const normalized = name.toLowerCase().trim();
    const entity = await this.ormRepo
      .createQueryBuilder('c')
      .where('c.company_id = :companyId', { companyId })
      .andWhere('LOWER(c.name) = :name', { name: normalized })
      .getOne();
    return entity ? this.toDomain(entity) : null;
  }

  async searchByName(
    companyId: string,
    query: string,
    limit = 10,
  ): Promise<Category[]> {
    const q = `%${query.toLowerCase()}%`;
    const entities = await this.ormRepo
      .createQueryBuilder('c')
      .where('c.company_id = :companyId', { companyId })
      .andWhere('c.is_active = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(c.name) LIKE :q OR LOWER(COALESCE(c.description, "")) LIKE :q OR LOWER(COALESCE(c.slug, "")) LIKE :q)',
        { q },
      )
      .orderBy('c.name', 'ASC')
      .limit(limit)
      .getMany();

    return entities.map((entity) => this.toDomain(entity));
  }
}
