export interface SupplierDto {
  id: string;
  companyId?: string;
  name: string;
  documentType: string | null;
  documentNumber: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  documentType?: string;
  documentNumber?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSupplierRequest {
  name?: string;
  documentType?: string | null;
  documentNumber?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface UpdateSupplierStatusRequest {
  isActive: boolean;
}

export type SupplierListResponseDto = SupplierDto[];

