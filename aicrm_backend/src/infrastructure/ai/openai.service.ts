import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AIService,
  AIMessageInput,
  AIResponse,
} from '../../domain/ports/ai.service.port';

/**
 * OpenAIService — Adaptador de infraestructura que implementa el puerto AIService.
 *
 * Flujo:
 * 1. Construye el prompt del sistema con rol, reglas y formato de respuesta JSON.
 * 2. Envía el historial de conversación + el nuevo mensaje del cliente.
 * 3. Parsea la respuesta JSON de OpenAI.
 * 4. Devuelve { reply, action? } al caso de uso que lo invoco.
 *
 * La IA puede devolver acciones (tools):
 *   - GET_PRODUCTS: para obtener catálogo real
 *   - CREATE_CUSTOMER: para registrar un nuevo cliente
 *   - CREATE_ORDER: para crear un pedido (order + items)
 */
@Injectable()
export class OpenAIService implements AIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  private buildSystemPrompt(): string {
    return `
Eres un asistente de ventas virtual para un CRM multi-empresa. Tu objetivo es ayudar a los clientes a encontrar productos, resolver dudas y cerrar ventas de forma efectiva.

## REGLAS ESTRICTAS:
- NUNCA inventes datos (precios, stock, nombres de productos).
- Usa SIEMPRE las tools disponibles para obtener datos reales.
- Detecta la intención del cliente: consulta, interés en comprar, comparación de precios.
- Guía al cliente hacia cerrar la venta de forma natural y amable.
- Si el cliente quiere comprar, recopila: producto(s), cantidad, datos del cliente (nombre, teléfono, email).
- Responde SIEMPRE en el mismo idioma que usa el cliente.

## TOOLS DISPONIBLES:
- GET_PRODUCTS: Obtiene el catálogo de productos de la empresa.
- CREATE_CUSTOMER: Registra un nuevo cliente con sus datos.
- CREATE_ORDER: Crea un pedido con los ítems seleccionados.

## FORMATO DE RESPUESTA (JSON estricto):
{
  "reply": "Texto de respuesta al cliente",
  "action": {
    "type": "GET_PRODUCTS | CREATE_CUSTOMER | CREATE_ORDER",
    "payload": {}
  }
}

Si no necesitas ejecutar ninguna acción, omite el campo "action".
El campo "reply" es SIEMPRE requerido.

## PAYLOAD por acción:
- GET_PRODUCTS: no requiere payload
- CREATE_CUSTOMER: { "name": "", "phone": "", "email": "", "identificationType": "", "identificationNumber": "" }
- CREATE_ORDER: { "customerId": "", "items": [{ "productId": "", "quantity": 0, "price": 0 }] }
`.trim();
  }

  async processMessage(input: AIMessageInput): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt();

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...input.history.map((h) => ({
        role: h.role === 'customer' ? ('user' as const) : ('assistant' as const),
        content: h.content,
      })),
      { role: 'user', content: input.customerMessage },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as AIResponse;

      if (!parsed.reply) {
        parsed.reply = 'Disculpa, no pude procesar tu mensaje. ¿Puedes repetirlo?';
      }

      return parsed;
    } catch (error) {
      this.logger.error('Fallo la solicitud a OpenAI', error);
      return {
        reply: 'Lo siento, estoy experimentando dificultades técnicas. Por favor intenta más tarde.',
      };
    }
  }
}
