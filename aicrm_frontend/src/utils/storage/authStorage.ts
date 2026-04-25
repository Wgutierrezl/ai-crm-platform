/**
 * Utilidad para gestionar almacenamiento de datos de autenticación en localStorage
 * Maneja: token JWT, userId, companyId
 */

export interface AuthData {
  token: string;
  userId: string;
  companyId: string;
  role?: string;
}

const STORAGE_KEYS = {
  TOKEN: "auth_token",
  USER_ID: "auth_userId",
  COMPANY_ID: "auth_companyId",
  ROLE: "auth_role",
};

export const authStorage = {
  /**
   * Guardar datos de autenticación en localStorage
   */
  setAuthData: (data: AuthData): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      localStorage.setItem(STORAGE_KEYS.USER_ID, data.userId);
      localStorage.setItem(STORAGE_KEYS.COMPANY_ID, data.companyId);
      if (data.role) {
        localStorage.setItem(STORAGE_KEYS.ROLE, data.role);
      }
    } catch (error) {
      console.error("Error al guardar datos de autenticación:", error);
    }
  },

  /**
   * Obtener datos de autenticación desde localStorage
   */
  getAuthData: (): AuthData | null => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const companyId = localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
      const role = localStorage.getItem(STORAGE_KEYS.ROLE);

      if (!token || !userId || !companyId) {
        return null;
      }

      return {
        token,
        userId,
        companyId,
        role: role || undefined,
      };
    } catch (error) {
      console.error("Error al obtener datos de autenticación:", error);
      return null;
    }
  },

  /**
   * Obtener solo el token JWT
   */
  getToken: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error("Error al obtener token:", error);
      return null;
    }
  },

  /**
   * Obtener solo el userId
   */
  getUserId: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_ID);
    } catch (error) {
      console.error("Error al obtener userId:", error);
      return null;
    }
  },

  /**
   * Obtener solo el companyId
   */
  getCompanyId: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.COMPANY_ID);
    } catch (error) {
      console.error("Error al obtener companyId:", error);
      return null;
    }
  },

  /**
   * Verificar si existe sesión activa
   */
  hasSession: (): boolean => {
    return authStorage.getAuthData() !== null;
  },

  /**
   * Limpiar todos los datos de autenticación
   */
  clearAuthData: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
      localStorage.removeItem(STORAGE_KEYS.COMPANY_ID);
      localStorage.removeItem(STORAGE_KEYS.ROLE);
    } catch (error) {
      console.error("Error al limpiar datos de autenticación:", error);
    }
  },
};
