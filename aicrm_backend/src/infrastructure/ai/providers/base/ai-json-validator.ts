import { AIAction, AIResponse } from '../../../../domain/ports/ai.service.port';
import { AIProviderError } from './ai-errors';

const FALLBACK_REPLY =
  'Perdon, tuve un problema tecnico. Intentalo de nuevo en unos segundos.';

export function validateAndBuildAIResponse(
  raw: string | null | undefined,
  strictJson: boolean,
  provider: string,
): AIResponse {
  if (!raw || !raw.trim()) {
    if (strictJson) {
      throw new AIProviderError(
        'Empty JSON response from provider',
        provider,
        true,
      );
    }
    return { reply: FALLBACK_REPLY };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    if (strictJson) {
      throw new AIProviderError('Invalid JSON response from provider', provider, true);
    }
    return { reply: FALLBACK_REPLY };
  }

  if (!parsed || typeof parsed !== 'object') {
    if (strictJson) {
      throw new AIProviderError(
        'Non-object JSON response from provider',
        provider,
        true,
      );
    }
    return { reply: FALLBACK_REPLY };
  }

  const candidate = parsed as Partial<AIResponse>;
  const reply =
    typeof candidate.reply === 'string' && candidate.reply.trim()
      ? candidate.reply.trim()
      : FALLBACK_REPLY;
  const action = sanitizeAction(candidate.action);
  return action ? { reply, action } : { reply };
}

function sanitizeAction(action: unknown): AIAction | undefined {
  if (!action || typeof action !== 'object') return undefined;
  const candidate = action as Partial<AIAction>;
  if (!candidate.type || typeof candidate.type !== 'string') return undefined;
  const payload =
    candidate.payload && typeof candidate.payload === 'object'
      ? candidate.payload
      : undefined;
  return { type: candidate.type, payload };
}

