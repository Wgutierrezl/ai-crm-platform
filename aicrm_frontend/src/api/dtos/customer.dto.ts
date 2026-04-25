/**
 * DTOs para Clientes
 */

// ===== REQUEST DTOs =====

export interface CreateCustomerRequestDto {
  name: string;
  phone: string;
  email: string;
  identificationType?: string;
  identificationNumber?: string;
}

// ===== RESPONSE DTOs =====

export interface CustomerDto {
  id: string;
  name: string;
  phone: string;
  email: string;
  companyId: string;
  identificationType?: string;
  identificationNumber?: string;
}

export type CustomerListResponseDto = CustomerDto[];
