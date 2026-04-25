/**
 * Servicio de Órdenes
 * Maneja operaciones CRUD de órdenes
 */

import apiClient from "../client/apiClient";
import { logger } from "../../utils/logger/logger";
import type {
  OrderDto,
  OrderListResponseDto,
  CreateOrderRequestDto,
  OrderItemRequestDto,
} from "../dtos/order.dto";

export const orderService = {
  /**
   * Obtener lista de órdenes de la empresa actual
   */
  async getOrders(): Promise<OrderListResponseDto> {
    try {
      logger.info("Obteniendo órdenes...");

      const response = await apiClient.get<OrderListResponseDto>("/orders");

      logger.info("Órdenes obtenidas exitosamente", {
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error("Error al obtener órdenes", error);
      throw error;
    }
  },

  /**
   * Crear nueva orden
   */
  async createOrder(
    customerId: string,
    items: OrderItemRequestDto[]
  ): Promise<OrderDto> {
    try {
      const payload: CreateOrderRequestDto = { customerId, items };

      logger.info("Creando orden...", {
        customerId,
        itemsCount: items.length,
      });

      const response = await apiClient.post<OrderDto>(
        "/orders",
        payload
      );

      logger.info("Orden creada exitosamente", {
        id: response.data.id,
        total: response.data.total,
      });

      return response.data;
    } catch (error) {
      logger.error("Error al crear orden", error);
      throw error;
    }
  },
};
