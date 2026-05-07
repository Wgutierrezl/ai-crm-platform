export class CompanyWhatsappApp {
  constructor(
    public readonly id: number,
    public readonly companyId: string | null,
    public readonly name: string,
    public readonly phoneNumberId: string,
    public readonly businessAccountId: string,
    public readonly appId: string | null,
    public readonly displayPhoneNumber: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
