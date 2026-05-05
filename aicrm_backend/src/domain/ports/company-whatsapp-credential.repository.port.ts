import { CompanyWhatsappCredential } from '../entities/company-whatsapp-credential.entity';

export abstract class CompanyWhatsappCredentialRepository {
  abstract create(
    credential: CompanyWhatsappCredential,
  ): Promise<CompanyWhatsappCredential>;

  abstract findByWhatsappAppId(
    whatsappAppId: number,
  ): Promise<CompanyWhatsappCredential | null>;

  abstract findActiveByWhatsappAppId(
    whatsappAppId: number,
  ): Promise<CompanyWhatsappCredential | null>;

  abstract findActiveByVerifyToken(
    verifyToken: string,
  ): Promise<CompanyWhatsappCredential | null>;

  abstract update(
    credential: CompanyWhatsappCredential,
  ): Promise<CompanyWhatsappCredential>;
}
