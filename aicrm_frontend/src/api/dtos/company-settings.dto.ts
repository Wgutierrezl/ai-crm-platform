export interface CompanySettingsDto {
  companyId: string;
  companyName: string;
  assistantName: string | null;
  assistantContext: string | null;
  assistantWelcomeMessage: string | null;
}

export interface UpdateCompanySettingsRequestDto {
  assistantName?: string | null;
  assistantContext?: string | null;
  assistantWelcomeMessage?: string | null;
}

