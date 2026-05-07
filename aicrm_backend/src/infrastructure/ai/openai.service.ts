import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import {
  AIService,
  AIMessageInput,
  AIResponse,
} from '../../domain/ports/ai.service.port';

@Injectable()
export class OpenAIService implements AIService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(OpenAIService.name);

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  private buildSystemPrompt(input: AIMessageInput): string {
    const basePrompt = this.safeReadPrompt('base/system.md');
    const whatsappPrompt = this.safeReadPrompt('channels/whatsapp/system.md');
    const salesPrompt = this.safeReadPrompt('assistants/sales/system.md');
    const noHallucination = this.safeReadPrompt(
      'partials/policies/no-hallucination.md',
    );
    const conciseStyle = this.safeReadPrompt('partials/style/concise-whatsapp.md');
    const onboardingToolsPrompt = this.safeReadPrompt(
      'partials/tools/onboarding-tools.md',
    );

    return `
${basePrompt}

${whatsappPrompt}

${salesPrompt}

${noHallucination}

${conciseStyle}

${onboardingToolsPrompt}

REGLAS OPERATIVAS DE RUNTIME:
1. Habla como asistente humano, cercano y moderno.
2. Usa emojis con moderación para transmitir calidez.
3. Evita respuestas secas o de una sola palabra.
4. Mantén mensajes cortos y claros para WhatsApp.
5. No repitas preguntas si ya tienes el dato.
6. Reutiliza contexto del perfil cuando exista.
7. Si faltan datos de negocio para responder, haz una sola pregunta concreta.
8. Explica en una frase breve por qué pides un dato.
9. Ofrece ayuda accionable al final del mensaje.
10. Nunca inventes datos de catálogo, precios o stock.
11. Nunca adivines si el usuario existe; usa solo el contexto "customer_exists".
12. Si "customer_exists=true" y "onboarding_completed=true", no inicies onboarding.
13. Si "onboarding_completed=false", continua desde "onboarding_step".
14. Un saludo por sí solo no es dato de perfil.

TOOLS DISPONIBLES:
- ASSISTANT_RESOLVE_USER_IDENTITY
- ASSISTANT_START_ONBOARDING
- ASSISTANT_COLLECT_PROFILE_DATA
- ASSISTANT_REGISTER_USER
- ASSISTANT_GET_USER_PROFILE
- ASSISTANT_UPDATE_USER_PROFILE
- GET_PRODUCTS
- CREATE_CUSTOMER
- CREATE_ORDER

FORMATO DE RESPUESTA:
{
  "reply": "mensaje final para el usuario",
  "action": {
    "type": "GET_PRODUCTS | CREATE_CUSTOMER | CREATE_ORDER",
    "payload": {}
  }
}

CONTEXTO ADICIONAL:
${JSON.stringify(input.assistantContext ?? {}, null, 2)}
`.trim();
  }

  async processMessage(input: AIMessageInput): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(input);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...input.history.map((h) => ({
        role:
          h.role === 'customer' ? ('user' as const) : ('assistant' as const),
        content: h.content,
      })),
      { role: 'user', content: input.customerMessage },
    ];

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw) as AIResponse;
      if (!parsed.reply) {
        parsed.reply =
          'Gracias por tu mensaje 😊 ¿Me cuentas un poco más para ayudarte mejor?';
      }
      return parsed;
    } catch (error) {
      this.logger.error('Fallo la solicitud a OpenAI', error);
      return {
        reply:
          'Perdón, tuve un problema técnico 🙏 Inténtalo de nuevo en unos segundos.',
      };
    }
  }

  private safeReadPrompt(relativePath: string): string {
    const absolute = path.resolve(process.cwd(), 'prompts', relativePath);
    try {
      return fs.readFileSync(absolute, 'utf-8');
    } catch {
      return '';
    }
  }
}
