/**
 * DTOs para Categorias
 */

export interface CreateCategoryRequestDto {
  name: string;
  description?: string;
  slug?: string;
  isActive?: boolean;
}

export interface CategoryDto {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  slug: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CategoryListResponseDto = CategoryDto[];

