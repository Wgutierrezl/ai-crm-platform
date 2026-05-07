import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CompanyWhatsappApp } from '../../domain/entities/company-whatsapp-app.entity';
import { CompanyWhatsappAppRepository } from '../../domain/ports/company-whatsapp-app.repository.port';
import { CompanyRepository } from '../../domain/ports/company.repository.port';

export interface UpsertCompanyWhatsappAppInput {
  companyId: string;
  name: string;
  phoneNumberId: string;
  businessAccountId: string;
  appId?: string;
  displayPhoneNumber?: string;
}

export interface UpsertCompanyWhatsappAppOutput {
  id: number;
  companyId: string | null;
  name: string;
  phoneNumberId: string;
  businessAccountId: string;
  appId: string | null;
  displayPhoneNumber: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UpsertCompanyWhatsappAppUseCase {
  private readonly logger = new Logger(UpsertCompanyWhatsappAppUseCase.name);

  constructor(
    private readonly appRepository: CompanyWhatsappAppRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  private sanitize(app: CompanyWhatsappApp): UpsertCompanyWhatsappAppOutput {
    return {
      id: app.id,
      companyId: app.companyId,
      name: app.name,
      phoneNumberId: app.phoneNumberId,
      businessAccountId: app.businessAccountId,
      appId: app.appId,
      displayPhoneNumber: app.displayPhoneNumber,
      isActive: app.isActive,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  async execute(
    input: UpsertCompanyWhatsappAppInput,
  ): Promise<UpsertCompanyWhatsappAppOutput> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new NotFoundException(
        `No existe company con id=${input.companyId}`,
      );
    }

    const existing = await this.appRepository.findByPhoneNumberId(
      input.phoneNumberId,
    );

    if (existing) {
      this.logger.log(
        `Actualizando app WhatsApp id=${existing.id}, phoneNumberId=${input.phoneNumberId}`,
      );
      const updated = new CompanyWhatsappApp(
        existing.id,
        input.companyId,
        input.name,
        input.phoneNumberId,
        input.businessAccountId,
        input.appId ?? null,
        input.displayPhoneNumber ?? null,
        true,
        existing.createdAt,
        new Date(),
      );
      const saved = await this.appRepository.update(updated);
      return this.sanitize(saved);
    }

    this.logger.log(
      `Creando app WhatsApp para phoneNumberId=${input.phoneNumberId}`,
    );
    const created = await this.appRepository.create({
      name: input.name,
      companyId: input.companyId,
      phoneNumberId: input.phoneNumberId,
      businessAccountId: input.businessAccountId,
      appId: input.appId ?? null,
      displayPhoneNumber: input.displayPhoneNumber ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.sanitize(created);
  }
}
