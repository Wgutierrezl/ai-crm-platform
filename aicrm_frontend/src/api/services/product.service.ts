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
  async createProduct(
    name: string,
    price: number,
    stock: number
  ): Promise<ProductDto> {
    try {
      const payload: CreateProductRequestDto = { name, price, stock };

      logger.info("Creando producto...", { name });

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
};
