import { CompanyWhatsappApp } from '../entities/company-whatsapp-app.entity';

export abstract class CompanyWhatsappAppRepository {
  abstract create(app: Omit<CompanyWhatsappApp, 'id'>): Promise<CompanyWhatsappApp>;
  abstract findById(id: number): Promise<CompanyWhatsappApp | null>;
  abstract findByPhoneNumberId(
    phoneNumberId: string,
  ): Promise<CompanyWhatsappApp | null>;
  abstract update(app: CompanyWhatsappApp): Promise<CompanyWhatsappApp>;
}
