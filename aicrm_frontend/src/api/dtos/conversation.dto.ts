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
  customer?: {
    id: string;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  lastMessage?: {
    id: string;
    content: string;
    role: "customer" | "agent" | "bot" | string;
    sourceChannel: string;
    createdAt: string;
  } | null;
  messageCount?: number;
  createdAt: string;
}

export type ConversationListResponseDto = ConversationDto[];
