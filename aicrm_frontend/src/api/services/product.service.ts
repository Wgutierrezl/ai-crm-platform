/**
 * Servicio de Productos
 * Maneja operaciones CRUD de productos
 */

import apiClient from "../client/apiClient";
import { logger } from "../../utils/logger/logger";
import type {
  ProductDto,
  ProductListResponseDto,
  CreateProductRequestDto,
  UpdateProductRequestDto,
} from "../dtos/product.dto";

export const productService = {
  /**
   * Obtener lista de productos de la empresa actual
   */
  async getProducts(): Promise<ProductListResponseDto> {
    try {
      logger.info("Obteniendo productos...");

      const response = await apiClient.get<ProductListResponseDto>(
        "/products"
      );

      logger.info("Productos obtenidos exitosamente", {
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error("Error al obtener productos", error);
      throw error;
    }
  },

  /**
   * Crear nuevo producto
   */
  async createProduct(payload: CreateProductRequestDto): Promise<ProductDto> {
    try {
      logger.info("Creando producto...", { name: payload.name });

      const response = await apiClient.post<ProductDto>(
        "/products",
        payload
      );

      logger.info("Producto creado exitosamente", { id: response.data.id });

      return response.data;
    } catch (error) {
      logger.error("Error al crear producto", error);
      throw error;
    }
  },

  /**
   * Actualizar producto existente
   */
  async updateProduct(
    id: string,
    payload: UpdateProductRequestDto,
  ): Promise<ProductDto> {
    try {
      logger.info("Actualizando producto...", { id });

      const response = await apiClient.patch<ProductDto>(
        `/products/${id}`,
        payload,
      );

      logger.info("Producto actualizado exitosamente", { id: response.data.id });
      return response.data;
    } catch (error) {
      logger.error("Error al actualizar producto", error);
      throw error;
    }
  },
};
