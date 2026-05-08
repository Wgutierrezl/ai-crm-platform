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
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
}

export type ProductListResponseDto = ProductDto[];
