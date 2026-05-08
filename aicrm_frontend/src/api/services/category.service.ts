import apiClient from "../client/apiClient";
import { logger } from "../../utils/logger/logger";
import type {
  CategoryDto,
  CategoryListResponseDto,
  CreateCategoryRequestDto,
} from "../dtos/category.dto";
import type { ProductListResponseDto } from "../dtos/product.dto";

export const categoryService = {
  async getCategories(): Promise<CategoryListResponseDto> {
    try {
      const response = await apiClient.get<CategoryListResponseDto>("/categories");
      return response.data;
    } catch (error) {
      logger.error("Error al obtener categorias", error);
      throw error;
    }
  },

  async getActiveCategories(): Promise<CategoryListResponseDto> {
    try {
      const response = await apiClient.get<CategoryListResponseDto>(
        "/categories/active",
      );
      return response.data;
    } catch (error) {
      logger.error("Error al obtener categorias activas", error);
      throw error;
    }
  },

  async createCategory(payload: CreateCategoryRequestDto): Promise<CategoryDto> {
    try {
      const response = await apiClient.post<CategoryDto>("/categories", payload);
      return response.data;
    } catch (error) {
      logger.error("Error al crear categoria", error);
      throw error;
    }
  },

  async getProductsByCategory(categoryId: string): Promise<ProductListResponseDto> {
    try {
      const response = await apiClient.get<ProductListResponseDto>(
        `/categories/${categoryId}/products`,
      );
      return response.data;
    } catch (error) {
      logger.error("Error al obtener productos por categoria", error);
      throw error;
    }
  },

  async updateCategoryStatus(
    id: string,
    isActive: boolean,
  ): Promise<CategoryDto> {
    try {
      const response = await apiClient.patch<CategoryDto>(
        `/categories/${id}/status`,
        { isActive },
      );
      return response.data;
    } catch (error) {
      logger.error("Error al actualizar estado de categoria", error);
      throw error;
    }
  },
};
