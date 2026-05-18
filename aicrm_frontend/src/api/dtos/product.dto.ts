/**
 * DTOs para Productos
 */

// ===== REQUEST DTOs =====

export interface CreateProductRequestDto {
  name: string;
  description?: string;
  price: number;
  stock: number;
  isActive?: boolean;
  sku?: string;
  brand?: string;
  currency?: string;
  minStock?: number;
  imageUrl?: string;
  categoryId?: string;
  supplierId?: string | null;
}

export interface UpdateProductRequestDto {
  name?: string;
  description?: string | null;
  price?: number;
  stock?: number;
  isActive?: boolean;
  sku?: string | null;
  brand?: string | null;
  currency?: string;
  minStock?: number;
  imageUrl?: string | null;
  categoryId?: string | null;
  supplierId?: string | null;
}

// ===== RESPONSE DTOs =====

export interface ProductDto {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  companyId: string;
  isActive: boolean;
  sku: string | null;
  brand: string | null;
  currency: string;
  minStock: number;
  imageUrl: string | null;
  categoryId: string | null;
  supplierId: string | null;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  supplier?: {
    id: string;
    name: string;
    isActive: boolean;
  } | null;
}

export type ProductListResponseDto = ProductDto[];
