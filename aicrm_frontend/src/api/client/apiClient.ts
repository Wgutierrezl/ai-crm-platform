/**
 * Cliente HTTP base configurado con Axios
 * Incluye:
 * - Configuración de baseURL desde variables de entorno
 * - Interceptor de request para agregar JWT automáticamente
 * - Interceptor de response para logueo
 * - Interceptor de error para manejo centralizado
 */

import axios from "axios";
import type {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import { logger } from "../../utils/logger/logger";
import { authStorage } from "../../utils/storage/authStorage";

// Crear instancia de Axios base
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Interceptor de REQUEST
 * Agrega token JWT al header Authorization automáticamente
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log de request
    logger.request(
      config.method?.toUpperCase() || "GET",
      config.url || "",
      config.data
    );

    return config;
  },
  (error: AxiosError) => {
    logger.error("Error en request interceptor", error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de RESPONSE
 * Loguea respuestas exitosas y maneja errores
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log de response exitosa
    logger.response(
      response.config.method?.toUpperCase() || "GET",
      response.config.url || "",
      response.status,
      response.data
    );
    return response;
  },
  (error: AxiosError) => {
    // Manejo de errores
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as Record<string, unknown>)?.message || "Error desconocido";

      logger.error(
        `API Error ${status}: ${error.config?.url}`,
        message
      );

      // Si es 401 (No autorizado), limpiar sesión
      if (status === 401) {
        logger.warn("Token expirado o inválido. Limpiando sesión...");
        authStorage.clearAuthData();
        // Aquí se podría redirigir a /login, pero se deja para que componentes lo manejen
      }

      // Si es 403 (Prohibido)
      if (status === 403) {
        logger.warn("Acceso prohibido");
      }

      // Si es 500 (Error del servidor)
      if (status >= 500) {
        logger.error("Error del servidor", error.response.data);
      }
    } else if (error.request) {
      // Request realizado pero sin response
      logger.error("No hay respuesta del servidor", error.request);
    } else {
      // Error en la configuración
      logger.error("Error en la solicitud", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
