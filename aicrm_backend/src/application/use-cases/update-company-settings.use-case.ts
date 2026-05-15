import { Injectable, NotFoundException } from '@nestjs/common';
import { CompanyRepository } from '../../domain/ports/company.repository.port';
import { CompanySettingsOutput } from './get-company-settings.use-case';

export interface UpdateCompanySettingsInput {
  companyId: string;
  assistantName?: string | null;
  assistantContext?: string | null;
  assistantWelcomeMessage?: string | null;
}

@Injectable()
export class UpdateCompanySettingsUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(input: UpdateCompanySettingsInput): Promise<CompanySettingsOutput> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const updated = await this.companyRepository.updateAssistantSettings({
      companyId: company.id,
      assistantName:
        input.assistantName !== undefined ? input.assistantName : company.assistantName,
      assistantContext:
        input.assistantContext !== undefined
          ? input.assistantContext
          : company.assistantContext,
      assistantWelcomeMessage:
        input.assistantWelcomeMessage !== undefined
          ? input.assistantWelcomeMessage
          : company.assistantWelcomeMessage,
    });

    return {
      companyId: updated.id,
      companyName: updated.name,
      assistantName: updated.assistantName,
      assistantContext: updated.assistantContext,
      assistantWelcomeMessage: updated.assistantWelcomeMessage,
    };
  }
}

