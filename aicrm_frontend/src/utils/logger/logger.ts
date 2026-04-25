/**
 * Logger centralizado para la aplicación
 * Proporciona métodos para logging consistente de eventos, errores y debug
 */

export const logger = {
  /**
   * Log general de información
   */
  log: (message: string, data?: unknown) => {
    console.log(`[LOG] ${new Date().toISOString()} - ${message}`, data || "");
  },

  /**
   * Log de información importante
   */
  info: (message: string, data?: unknown) => {
    console.info(`[INFO] ${new Date().toISOString()} - ${message}`, data || "");
  },

  /**
   * Log de advertencias
   */
  warn: (message: string, data?: unknown) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || "");
  },

  /**
   * Log de errores
   */
  error: (message: string, error?: unknown) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error || ""
    );
  },

  /**
   * Log de requests HTTP
   */
  request: (method: string, url: string, data?: unknown) => {
    console.log(
      `[REQUEST] ${method} ${url}`,
      data ? `Data: ${JSON.stringify(data)}` : ""
    );
  },

  /**
   * Log de responses HTTP
   */
  response: (method: string, url: string, status: number, data?: unknown) => {
    console.log(
      `[RESPONSE] ${status} ${method} ${url}`,
      data ? `Data: ${JSON.stringify(data)}` : ""
    );
  },

  /**
   * Log de debug (solo en desarrollo)
   */
  debug: (message: string, data?: unknown) => {
    if (import.meta.env.DEV) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || "");
    }
  },
};
