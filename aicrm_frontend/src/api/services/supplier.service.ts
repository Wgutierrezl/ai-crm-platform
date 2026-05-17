import apiClient from "../client/apiClient";
import { logger } from "../../utils/logger/logger";
import type {
  CreateSupplierRequest,
  SupplierDto,
  SupplierListResponseDto,
  UpdateSupplierRequest,
  UpdateSupplierStatusRequest,
} from "../dtos/supplier.dto";

export const supplierService = {
  async getSuppliers(): Promise<SupplierListResponseDto> {
    try {
      const response = await apiClient.get<SupplierListResponseDto>("/suppliers");
      return response.data;
    } catch (error) {
      logger.error("Error al obtener proveedores", error);
      throw error;
    }
  },

  async getSupplierById(id: string): Promise<SupplierDto> {
    try {
      const response = await apiClient.get<SupplierDto>(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      logger.error("Error al obtener proveedor por id", error);
      throw error;
    }
  },

  async createSupplier(payload: CreateSupplierRequest): Promise<SupplierDto> {
    try {
      const response = await apiClient.post<SupplierDto>("/suppliers", payload);
      return response.data;
    } catch (error) {
      logger.error("Error al crear proveedor", error);
      throw error;
    }
  },

  async updateSupplier(
    id: string,
    payload: UpdateSupplierRequest,
  ): Promise<SupplierDto> {
    try {
      const response = await apiClient.patch<SupplierDto>(`/suppliers/${id}`, payload);
      return response.data;
    } catch (error) {
      logger.error("Error al actualizar proveedor", error);
      throw error;
    }
  },

  async updateSupplierStatus(
    id: string,
    isActive: boolean,
  ): Promise<SupplierDto> {
    try {
      const payload: UpdateSupplierStatusRequest = { isActive };
      const response = await apiClient.patch<SupplierDto>(
        `/suppliers/${id}/status`,
        payload,
      );
      return response.data;
    } catch (error) {
      logger.error("Error al actualizar estado de proveedor", error);
      throw error;
    }
  },
};

