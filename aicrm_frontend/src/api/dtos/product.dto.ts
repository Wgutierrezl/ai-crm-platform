/**
 * DTOs para Productos
 */

// ===== REQUEST DTOs =====

export interface CreateProductRequestDto {
  name: string;
  price: number;
  stock: number;
}

// ===== RESPONSE DTOs =====

export interface ProductDto {
  id: string;
  name: string;
  price: number;
  stock: number;
  companyId: string;
}

export type ProductListResponseDto = ProductDto[];
