/**
 * Servicio de Conversaciones
 * Maneja operaciones CRUD de conversaciones con clientes
 */

import apiClient from "../client/apiClient";
import { logger } from "../../utils/logger/logger";
import type {
  ConversationDto,
  ConversationListResponseDto,
  CreateConversationRequestDto,
} from "../dtos/conversation.dto";
import type { MessageListResponseDto } from "../dtos/message.dto";

export const conversationService = {
  /**
   * Obtener lista de conversaciones de la empresa actual
   */
  async getConversations(): Promise<ConversationListResponseDto> {
    try {
      logger.info("Obteniendo conversaciones...");

      const response = await apiClient.get<ConversationListResponseDto>(
        "/conversations"
      );

      logger.info("Conversaciones obtenidas exitosamente", {
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error("Error al obtener conversaciones", error);
      throw error;
    }
  },

  /**
   * Crear nueva conversación con un cliente
   */
  async createConversation(customerId: string): Promise<ConversationDto> {
    try {
      const payload: CreateConversationRequestDto = { customerId };

      logger.info("Creando conversación...", { customerId });

      const response = await apiClient.post<ConversationDto>(
        "/conversations",
        payload
      );

      logger.info("Conversación creada exitosamente", {
        id: response.data.id,
      });

      return response.data;
    } catch (error) {
      logger.error("Error al crear conversación", error);
      throw error;
    }
  },

  /**
   * Obtener historial de mensajes de una conversacion
   */
  async getConversationMessages(conversationId: string): Promise<MessageListResponseDto> {
    try {
      logger.info("Obteniendo mensajes de conversacion...", { conversationId });

      const response = await apiClient.get<MessageListResponseDto>(
        `/conversations/${conversationId}/messages`,
      );

      logger.info("Mensajes de conversacion obtenidos exitosamente", {
        conversationId,
        count: response.data.length,
      });

      return response.data;
    } catch (error) {
      logger.error("Error al obtener mensajes de conversacion", error);
      throw error;
    }
  },
};
