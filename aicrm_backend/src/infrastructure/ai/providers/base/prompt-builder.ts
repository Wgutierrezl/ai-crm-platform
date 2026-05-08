import * as fs from 'fs';
import * as path from 'path';
import { AIMessageInput } from '../../../../domain/ports/ai.service.port';

export function buildSystemPrompt(input: AIMessageInput): string {
  const basePrompt = safeReadPrompt('base/system.md');
  const whatsappPrompt = safeReadPrompt('channels/whatsapp/system.md');
  const salesPrompt = safeReadPrompt('assistants/sales/system.md');
  const noHallucination = safeReadPrompt('partials/policies/no-hallucination.md');
  const conciseStyle = safeReadPrompt('partials/style/concise-whatsapp.md');
  const onboardingToolsPrompt = safeReadPrompt('partials/tools/onboarding-tools.md');
  const productsToolsPrompt = safeReadPrompt('partials/tools/products-tools.md');

  return `
${basePrompt}

${whatsappPrompt}

${salesPrompt}

${noHallucination}

${conciseStyle}

${onboardingToolsPrompt}

${productsToolsPrompt}

REGLAS OPERATIVAS DE RUNTIME:
1. Habla como asistente humano, cercano y moderno.
2. Usa emojis con moderacion para transmitir calidez.
3. Evita respuestas secas o de una sola palabra.
4. Manten mensajes cortos y claros para WhatsApp.
5. No repitas preguntas si ya tienes el dato.
6. Reutiliza contexto del perfil cuando exista.
7. Si faltan datos de negocio para responder, haz una sola pregunta concreta.
8. Explica en una frase breve por que pides un dato.
9. Ofrece ayuda accionable al final del mensaje.
10. Nunca inventes datos de catalogo, precios o stock.
11. Nunca adivines si el usuario existe; usa solo el contexto "customer_exists".
12. Si "customer_exists=true" y "onboarding_completed=true", no inicies onboarding.
13. Si "onboarding_completed=false", continua desde "onboarding_step".
14. Un saludo por si solo no es dato de perfil.

TOOLS DISPONIBLES:
- ASSISTANT_RESOLVE_USER_IDENTITY
- ASSISTANT_START_ONBOARDING
- ASSISTANT_COLLECT_PROFILE_DATA
- ASSISTANT_REGISTER_USER
- ASSISTANT_GET_USER_PROFILE
- ASSISTANT_UPDATE_USER_PROFILE
- CRM_GET_CATEGORIES
- CRM_SEARCH_CATEGORIES
- CRM_GET_PRODUCTS_BY_CATEGORY
- CRM_GET_CATEGORY_BY_NAME
- CRM_GET_PRODUCTS
- CRM_SEARCH_PRODUCTS
- CRM_GET_PRODUCT_BY_NAME
- CRM_FILTER_PRODUCTS_BY_PRICE
- CRM_GET_PRODUCT_STOCK
- CRM_SEARCH_PRODUCTS_BY_CATEGORY_OR_TEXT
- CRM_GET_PRODUCTS_BY_CATEGORY_AND_PRICE

FORMATO DE RESPUESTA:
{
  "reply": "mensaje final para el usuario",
  "action": {
    "type": "CRM_GET_PRODUCTS | CRM_SEARCH_PRODUCTS | CRM_GET_PRODUCT_BY_NAME | CRM_FILTER_PRODUCTS_BY_PRICE | CRM_GET_PRODUCT_STOCK",
    "payload": {}
  }
}

REGLAS DE PRODUCTOS:
1. Si preguntan por catalogo general: usa CRM_GET_PRODUCTS.
2. Si preguntan por categorias: usa CRM_GET_CATEGORIES o CRM_SEARCH_CATEGORIES.
3. Si preguntan por "productos de X": intenta CRM_GET_PRODUCTS_BY_CATEGORY.
4. Si preguntan por tipo/categoria/palabra: usa CRM_SEARCH_PRODUCTS_BY_CATEGORY_OR_TEXT con "query".
5. Si preguntan por nombre exacto o aproximado: usa CRM_GET_PRODUCT_BY_NAME con "name".
6. Si piden baratos/rango/precio por categoria: usa CRM_GET_PRODUCTS_BY_CATEGORY_AND_PRICE.
7. Si piden baratos/rango/precio general: usa CRM_FILTER_PRODUCTS_BY_PRICE.
8. Si preguntan por disponibilidad/unidades: usa CRM_GET_PRODUCT_STOCK.
9. Nunca inventes productos, precios ni stock.
10. Nunca muestres JSON ni nombres internos de tools al usuario final.
11. Responde en formato breve y amigable para WhatsApp.

CONTEXTO ADICIONAL:
${JSON.stringify(input.assistantContext ?? {}, null, 2)}
`.trim();
}

export function buildChatMessages(input: AIMessageInput): Array<{
  role: 'system' | 'user' | 'assistant';
  content: string;
}> {
  return [
    { role: 'system', content: buildSystemPrompt(input) },
    ...input.history.map((h) => ({
      role: h.role === 'customer' ? ('user' as const) : ('assistant' as const),
      content: h.content,
    })),
    { role: 'user', content: input.customerMessage },
  ];
}

function safeReadPrompt(relativePath: string): string {
  const absolute = path.resolve(process.cwd(), 'prompts', relativePath);
  try {
    return fs.readFileSync(absolute, 'utf-8');
  } catch {
    return '';
  }
}
