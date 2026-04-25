/**
 * Interfaces comunes para respuestas de API
 */

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  timestamp?: string;
  path?: string;
}

export interface ApiSuccessResponse<T> {
  statusCode: number;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
