export interface CompanySettingsDto {
  companyId: string;
  companyName: string;
  assistantName: string | null;
  assistantContext: string | null;
  assistantWelcomeMessage: string | null;
  logoUrl: string | null;
}

export interface UpdateCompanySettingsRequestDto {
  assistantName?: string | null;
  assistantContext?: string | null;
  assistantWelcomeMessage?: string | null;
  logoUrl?: string | null;
}

