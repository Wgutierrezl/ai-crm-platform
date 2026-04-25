/**
 * DTOs (Data Transfer Objects) para Autenticación
 * Mapean estructuras del backend hacia el frontend
 */

// ===== REQUEST DTOs =====

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  companyName: string;
  email: string;
  password: string;
  identificationType: string;
  identificationNumber: string;
  fullName?: string;
}

// ===== RESPONSE DTOs =====

export interface LoginResponseDto {
  accessToken: string;
  userId: string;
  companyId: string;
  role: string;
}

export interface RegisterResponseDto {
  userId: string;
  companyId: string;
  email: string;
}

export interface UserDto {
  id: string;
  email: string;
  role: string;
  companyId: string;
  fullName?: string;
  identificationType?: string;
  identificationNumber?: string;
}
