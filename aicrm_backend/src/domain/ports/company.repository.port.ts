import { Company } from '../entities/company.entity';

export abstract class CompanyRepository {
  abstract create(company: Company): Promise<Company>;
  abstract findById(id: string): Promise<Company | null>;
  abstract updateAssistantSettings(input: {
    companyId: string;
    assistantName: string | null;
    assistantContext: string | null;
    assistantWelcomeMessage: string | null;
  }): Promise<Company>;
  abstract findAllByCompanyId(companyId: string): Promise<Company[]>;
}
