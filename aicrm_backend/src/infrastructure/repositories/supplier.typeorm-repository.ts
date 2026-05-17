import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Supplier } from '../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../domain/ports/supplier.repository.port';
import { SupplierOrmEntity } from '../database/entities/supplier.orm-entity';

@Injectable()
export class SupplierTypeormRepository implements SupplierRepository {
  constructor(
    @InjectRepository(SupplierOrmEntity)
    private readonly ormRepo: Repository<SupplierOrmEntity>,
  ) {}

  private toDomain(entity: SupplierOrmEntity): Supplier {
    return new Supplier(
      entity.id,
      entity.companyId,
      entity.name,
      entity.documentType ?? null,
      entity.documentNumber ?? null,
      entity.contactName ?? null,
      entity.phone ?? null,
      entity.email ?? null,
      entity.address ?? null,
      entity.city ?? null,
      entity.notes ?? null,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(supplier: Supplier): Promise<Supplier> {
    const saved = await this.ormRepo.save(
      this.ormRepo.create({
        id: supplier.id,
        companyId: supplier.companyId,
        name: supplier.name,
        documentType: supplier.documentType,
        documentNumber: supplier.documentNumber,
        contactName: supplier.contactName,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        city: supplier.city,
        notes: supplier.notes,
        isActive: supplier.isActive,
        createdAt: supplier.createdAt,
        updatedAt: supplier.updatedAt,
      }),
    );
    return this.toDomain(saved);
  }

  async update(supplier: Supplier): Promise<Supplier> {
    const existing = await this.ormRepo.findOne({
      where: { id: supplier.id, companyId: supplier.companyId },
    });
    if (!existing) {
      throw new Error('Proveedor no encontrado para actualizar');
    }

    existing.name = supplier.name;
    existing.documentType = supplier.documentType;
    existing.documentNumber = supplier.documentNumber;
    existing.contactName = supplier.contactName;
    existing.phone = supplier.phone;
    existing.email = supplier.email;
    existing.address = supplier.address;
    existing.city = supplier.city;
    existing.notes = supplier.notes;
    existing.isActive = supplier.isActive;
    existing.updatedAt = supplier.updatedAt;

    const saved = await this.ormRepo.save(existing);
    return this.toDomain(saved);
  }

  async findByIdAndCompanyId(
    id: string,
    companyId: string,
  ): Promise<Supplier | null> {
    const entity = await this.ormRepo.findOne({ where: { id, companyId } });
    return entity ? this.toDomain(entity) : null;
  }

  async findAllByCompanyId(companyId: string): Promise<Supplier[]> {
    const entities = await this.ormRepo.find({
      where: { companyId },
      order: { name: 'ASC' },
    });
    return entities.map((entity) => this.toDomain(entity));
  }
}

