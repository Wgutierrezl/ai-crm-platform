/**
 * Servicio de Clientes
 * Maneja operaciones CRUD de clientes
 */

import apiClient from "../client/apiClient";
import { logger } from "../../utils/logger/logger";
import type {
  CustomerDto,
  CustomerListResponseDto,
  CreateCustomerRequestDto,
} from "../dtos/customer.dto";

export const customerService = {
  /**
   * Obtener lista de clientes de la empresa actual
   */
  async getCustomers(): Promise<CustomerListResponseDto> {
    try {
      logger.info("Obteniendo clientes...");

      const response = await apiClient.get<CustomerListResponseDto>(
        "/customers"
      );

      logger.info("Clientes obtenidos exitosamente", {
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error("Error al obtener clientes", error);
      throw error;
    }
  },

  /**
   * Crear nuevo cliente
   */
  async createCustomer(
    name: string,
    phone: string,
    email: string,
    identificationType?: string,
    identificationNumber?: string
  ): Promise<CustomerDto> {
    try {
      const payload: CreateCustomerRequestDto = {
        name,
        phone,
        email,
        identificationType,
        identificationNumber,
      };

      logger.info("Creando cliente...", { name, email });

      const response = await apiClient.post<CustomerDto>(
        "/customers",
        payload
      );

      logger.info("Cliente creado exitosamente", { id: response.data.id });

      return response.data;
    } catch (error) {
      logger.error("Error al crear cliente", error);
      throw error;
    }
  },
};
