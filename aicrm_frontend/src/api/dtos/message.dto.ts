/**
 * DTOs para Mensajes
 */

// ===== REQUEST DTOs =====

export interface SendMessageRequestDto {
  conversationId: string;
  content: string;
}

// ===== RESPONSE DTOs =====

export type MessageRole = "customer" | "agent" | "bot";

export interface MessageDto {
  id: string;
  conversationId: string;
  companyId: string;
  content: string;
  role: MessageRole;
  createdAt: string;
}

export interface ProcessIncomingMessageResponseDto {
  customerMessage: MessageDto;
  botMessage: MessageDto;
  actionExecuted?: string;
}

export type MessageListResponseDto = MessageDto[];
