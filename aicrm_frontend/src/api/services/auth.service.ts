/**
 * Servicio de Autenticación
 * Maneja login, register y logout
 */

import apiClient from "../client/apiClient";
import { logger } from "../../utils/logger/logger";
import { authStorage } from "../../utils/storage/authStorage";
import type {
  LoginRequestDto,
  LoginResponseDto,
  RegisterRequestDto,
  RegisterResponseDto,
} from "../dtos/auth.dto";

export const authService = {
  /**
   * Iniciar sesión con email y contraseña
   * Guarda token en localStorage automáticamente
   */
  async login(
    email: string,
    password: string
  ): Promise<LoginResponseDto> {
    try {
      const payload: LoginRequestDto = { email, password };
      logger.info("Intentando login...", { email });

      const response = await apiClient.post<LoginResponseDto>(
        "/auth/login",
        payload
      );

      const authData = response.data;

      // Guardar en localStorage
      authStorage.setAuthData({
        token: authData.accessToken,
        userId: authData.userId,
        companyId: authData.companyId,
        role: authData.role,
      });

      logger.info("Login exitoso", { userId: authData.userId });
      return authData;
    } catch (error) {
      logger.error("Error en login", error);
      throw error;
    }
  },

  /**
   * Registrar nuevo usuario y empresa
   */
  async register(
    companyName: string,
    email: string,
    password: string,
    identificationType: string,
    identificationNumber: string,
    fullName?: string
  ): Promise<RegisterResponseDto> {
    try {
      const payload: RegisterRequestDto = {
        companyName,
        email,
        password,
        identificationType,
        identificationNumber,
        fullName,
      };

      logger.info("Intentando registro...", { email, companyName });

      const response = await apiClient.post<RegisterResponseDto>(
        "/auth/register",
        payload
      );

      logger.info("Registro exitoso", {
        userId: response.data.userId,
        companyId: response.data.companyId,
      });

      return response.data;
    } catch (error) {
      logger.error("Error en registro", error);
      throw error;
    }
  },

  /**
   * Cerrar sesión
   * Limpia token de localStorage
   */
  logout(): void {
    try {
      authStorage.clearAuthData();
      logger.info("Sesión cerrada");
    } catch (error) {
      logger.error("Error al cerrar sesión", error);
    }
  },

  /**
   * Verificar si existe sesión activa
   */
  hasActiveSession(): boolean {
    return authStorage.hasSession();
  },
};
