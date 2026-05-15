import apiClient from "../client/apiClient";
import { logger } from "../../utils/logger/logger";
import type {
  CompanySettingsDto,
  UpdateCompanySettingsRequestDto,
} from "../dtos/company-settings.dto";

export const companySettingsService = {
  async getSettings(): Promise<CompanySettingsDto> {
    try {
      const response = await apiClient.get<CompanySettingsDto>("/company/settings");
      return response.data;
    } catch (error) {
      logger.error("Error al obtener configuracion de empresa", error);
      throw error;
    }
  },

  async updateSettings(
    payload: UpdateCompanySettingsRequestDto,
  ): Promise<CompanySettingsDto> {
    try {
      const response = await apiClient.patch<CompanySettingsDto>(
        "/company/settings",
        payload,
      );
      return response.data;
    } catch (error) {
      logger.error("Error al actualizar configuracion de empresa", error);
      throw error;
    }
  },
};

