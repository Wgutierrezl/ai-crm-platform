import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyWhatsappCredentialRepository } from '../../domain/ports/company-whatsapp-credential.repository.port';
import { CompanyWhatsappCredential } from '../../domain/entities/company-whatsapp-credential.entity';
import { CompanyWhatsappCredentialOrmEntity } from '../database/entities/company-whatsapp-credential.orm-entity';

@Injectable()
export class CompanyWhatsappCredentialTypeormRepository implements CompanyWhatsappCredentialRepository {
  private readonly logger = new Logger(
    CompanyWhatsappCredentialTypeormRepository.name,
  );

  constructor(
    @InjectRepository(CompanyWhatsappCredentialOrmEntity)
    private readonly ormRepo: Repository<CompanyWhatsappCredentialOrmEntity>,
  ) {}

  private toDomain(
    entity: CompanyWhatsappCredentialOrmEntity,
  ): CompanyWhatsappCredential {
    return new CompanyWhatsappCredential(
      entity.id,
      entity.whatsappAppId,
      entity.accessToken,
      entity.verifyToken,
      entity.appSecret ?? null,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(
    credential: CompanyWhatsappCredential,
  ): Promise<CompanyWhatsappCredential> {
    this.logger.log(
      `Creando credencial WhatsApp para whatsappAppId=${credential.whatsappAppId}`,
    );
    const entity = this.ormRepo.create({
      id: credential.id,
      whatsappAppId: credential.whatsappAppId,
      accessToken: credential.accessToken,
      verifyToken: credential.verifyToken,
      appSecret: credential.appSecret,
      isActive: credential.isActive,
      createdAt: credential.createdAt,
      updatedAt: credential.updatedAt,
    });

    const saved = await this.ormRepo.save(entity);
    return this.toDomain(saved);
  }

  async findByWhatsappAppId(
    whatsappAppId: number,
  ): Promise<CompanyWhatsappCredential | null> {
    const entity = await this.ormRepo.findOne({
      where: { whatsappAppId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findActiveByWhatsappAppId(
    whatsappAppId: number,
  ): Promise<CompanyWhatsappCredential | null> {
    const entity = await this.ormRepo.findOne({
      where: { whatsappAppId, isActive: true },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findActiveByVerifyToken(
    verifyToken: string,
  ): Promise<CompanyWhatsappCredential | null> {
    const entity = await this.ormRepo.findOne({
      where: { verifyToken, isActive: true },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async update(
    credential: CompanyWhatsappCredential,
  ): Promise<CompanyWhatsappCredential> {
    this.logger.log(
      `Actualizando credencial WhatsApp para whatsappAppId=${credential.whatsappAppId}`,
    );
    await this.ormRepo.update(
      { id: credential.id },
      {
        whatsappAppId: credential.whatsappAppId,
        accessToken: credential.accessToken,
        verifyToken: credential.verifyToken,
        appSecret: credential.appSecret,
        isActive: credential.isActive,
        updatedAt: credential.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({ id: credential.id });
    return this.toDomain(updated);
  }
}
