import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from '../../domain/ports/company.repository.port';

export interface CompanySettingsOutput {
  companyId: string;
  companyName: string;
  assistantName: string | null;
  assistantContext: string | null;
  assistantWelcomeMessage: string | null;
}

@Injectable()
export class GetCompanySettingsUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(companyId: string): Promise<CompanySettingsOutput> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return {
      companyId: company.id,
      companyName: company.name,
      assistantName: company.assistantName,
      assistantContext: company.assistantContext,
      assistantWelcomeMessage: company.assistantWelcomeMessage,
    };
  }
}

