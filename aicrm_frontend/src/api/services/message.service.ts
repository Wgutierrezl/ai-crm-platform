/**
 * Servicio de Mensajes
 * Maneja envío de mensajes y procesamiento de IA
 */

import apiClient from "../client/apiClient";
import { logger } from "../../utils/logger/logger";
import type {
  MessageDto,
  SendMessageRequestDto,
  ProcessIncomingMessageResponseDto,
} from "../dtos/message.dto";

export const messageService = {
  /**
   * Enviar mensaje manual a una conversación
   */
  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<MessageDto> {
    try {
      const payload: SendMessageRequestDto = { conversationId, content };

      logger.info("Enviando mensaje...", { conversationId });

      const response = await apiClient.post<MessageDto>(
        "/messages",
        payload
      );

      logger.info("Mensaje enviado exitosamente", { id: response.data.id });

      return response.data;
    } catch (error) {
      logger.error("Error al enviar mensaje", error);
      throw error;
    }
  },

  /**
   * Procesar mensaje entrante con IA
   * El backend analiza el mensaje y puede ejecutar actions
   */
  async processIncomingMessage(
    conversationId: string,
    content: string
  ): Promise<ProcessIncomingMessageResponseDto> {
    try {
      const payload: SendMessageRequestDto = { conversationId, content };

      logger.info("Procesando mensaje con IA...", { conversationId });

      const response = await apiClient.post<ProcessIncomingMessageResponseDto>(
        "/messages/incoming",
        payload
      );

      logger.info("Mensaje procesado exitosamente", {
        action: response.data.actionExecuted,
      });

      return response.data;
    } catch (error) {
      logger.error("Error al procesar mensaje", error);
      throw error;
    }
  },
};
