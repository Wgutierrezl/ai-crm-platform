/**
 * Servicio de Autenticación
 * Maneja login, register y logout
 */

import apiClient from "../client/apiClient";
import type { AxiosError } from "axios";
import { logger } from "../../utils/logger/logger";
import { authStorage } from "../../utils/storage/authStorage";
import type {
  LoginRequestDto,
  LoginResponseDto,
  GoogleExchangeResponseDto,
  GoogleExchangeRequestDto,
  GoogleCompleteRegistrationRequestDto,
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
   * URL de inicio para OAuth con Google.
   */
  getGoogleStartUrl(): string {
    const url = (
      import.meta.env.VITE_GOOGLE_LOGIN_START_URL ||
      `${import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"}/auth/google/start`
    );
    logger.info("[GoogleOAuth][FrontendStart] resolved start url", { url });
    return url;
  },

  /**
   * Intercambia auth code temporal por JWT propio del backend.
   */
  async exchangeGoogleAuthCode(code: string): Promise<GoogleExchangeResponseDto> {
    const payload: GoogleExchangeRequestDto = { authCode: code };
    logger.info("[GoogleOAuth][FrontendSuccess] exchange request", {
      hasCode: Boolean(code),
      codeMasked: `${code.slice(0, 4)}...${code.slice(-4)}`,
      payloadKeys: Object.keys(payload),
      payload,
    });
    try {
      const response = await apiClient.post<GoogleExchangeResponseDto>(
        "/auth/google/exchange",
        payload
      );

      logger.info("[GoogleOAuth][FrontendSuccess] exchange success", {
        status: response.status,
        body: response.data,
      });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      const responseData = axiosError.response?.data as unknown;
      logger.error("[GoogleOAuth][FrontendSuccess] exchange failed", {
        status: axiosError.response?.status,
        data: responseData,
        message: axiosError.message,
      });
      throw error;
    }
  },

  async completeGoogleRegistration(
    payload: GoogleCompleteRegistrationRequestDto
  ): Promise<LoginResponseDto> {
    logger.info("[GoogleOAuth][FrontendCompleteRegistration] request", {
      payload: {
        registrationToken: `${payload.registrationToken.slice(0, 4)}...${payload.registrationToken.slice(-4)}`,
        companyName: payload.companyName,
        identificationType: payload.identificationType,
        identificationNumberMasked: `${payload.identificationNumber.slice(0, 2)}...${payload.identificationNumber.slice(-2)}`,
      },
    });
    const response = await apiClient.post<LoginResponseDto>(
      "/auth/google/complete-registration",
      payload
    );
    logger.info("[GoogleOAuth][FrontendCompleteRegistration] success", {
      status: response.status,
      userId: response.data.userId,
      companyId: response.data.companyId,
    });
    return response.data;
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
