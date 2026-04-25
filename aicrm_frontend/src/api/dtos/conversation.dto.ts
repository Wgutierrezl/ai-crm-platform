/**
 * DTOs para Conversaciones
 */

// ===== REQUEST DTOs =====

export interface CreateConversationRequestDto {
  customerId: string;
}

// ===== RESPONSE DTOs =====

export interface ConversationDto {
  id: string;
  customerId: string;
  companyId: string;
  createdAt: string;
}

export type ConversationListResponseDto = ConversationDto[];
