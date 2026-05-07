import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyWhatsappApp } from '../../domain/entities/company-whatsapp-app.entity';
import { CompanyWhatsappAppRepository } from '../../domain/ports/company-whatsapp-app.repository.port';
import { CompanyWhatsappAppOrmEntity } from '../database/entities/company-whatsapp-app.orm-entity';

@Injectable()
export class CompanyWhatsappAppTypeormRepository
  implements CompanyWhatsappAppRepository
{
  constructor(
    @InjectRepository(CompanyWhatsappAppOrmEntity)
    private readonly ormRepo: Repository<CompanyWhatsappAppOrmEntity>,
  ) {}

  private toDomain(entity: CompanyWhatsappAppOrmEntity): CompanyWhatsappApp {
    return new CompanyWhatsappApp(
      entity.id,
      entity.companyId ?? null,
      entity.name,
      entity.phoneNumberId,
      entity.businessAccountId,
      entity.appId ?? null,
      entity.displayPhoneNumber ?? null,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(
    app: Omit<CompanyWhatsappApp, 'id'>,
  ): Promise<CompanyWhatsappApp> {
    const entity = this.ormRepo.create({
      name: app.name,
      companyId: app.companyId,
      phoneNumberId: app.phoneNumberId,
      businessAccountId: app.businessAccountId,
      appId: app.appId,
      displayPhoneNumber: app.displayPhoneNumber,
      isActive: app.isActive,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    });
    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: number): Promise<CompanyWhatsappApp | null> {
    const entity = await this.ormRepo.findOneBy({ id });
    return entity ? this.toDomain(entity) : null;
  }

  async findByPhoneNumberId(
    phoneNumberId: string,
  ): Promise<CompanyWhatsappApp | null> {
    const entity = await this.ormRepo.findOneBy({ phoneNumberId });
    return entity ? this.toDomain(entity) : null;
  }

  async update(app: CompanyWhatsappApp): Promise<CompanyWhatsappApp> {
    await this.ormRepo.update(
      { id: app.id },
      {
        name: app.name,
        companyId: app.companyId,
        phoneNumberId: app.phoneNumberId,
        businessAccountId: app.businessAccountId,
        appId: app.appId,
        displayPhoneNumber: app.displayPhoneNumber,
        isActive: app.isActive,
        updatedAt: app.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({ id: app.id });
    return this.toDomain(updated);
  }
}
