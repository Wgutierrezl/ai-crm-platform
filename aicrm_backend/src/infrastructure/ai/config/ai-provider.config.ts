import { ConfigService } from '@nestjs/config';

export type AIProviderName = 'openai' | 'groq' | 'ollama';

export interface AIProviderRuntimeConfig {
  primary: AIProviderName;
  fallback: AIProviderName | 'none';
  timeoutMs: number;
  maxRetries: number;
  strictJson: boolean;
}

const VALID_PROVIDERS: AIProviderName[] = ['openai', 'groq', 'ollama'];

export function loadAIProviderRuntimeConfig(
  configService: ConfigService,
): AIProviderRuntimeConfig {
  const primaryRaw = (
    configService.get<string>('AI_PROVIDER_PRIMARY', 'openai') ?? 'openai'
  ).toLowerCase();
  const fallbackRaw = (
    configService.get<string>('AI_PROVIDER_FALLBACK', 'none') ?? 'none'
  ).toLowerCase();

  const primary = VALID_PROVIDERS.includes(primaryRaw as AIProviderName)
    ? (primaryRaw as AIProviderName)
    : 'openai';
  const fallback =
    fallbackRaw === 'none'
      ? 'none'
      : VALID_PROVIDERS.includes(fallbackRaw as AIProviderName)
        ? (fallbackRaw as AIProviderName)
        : 'none';

  return {
    primary,
    fallback,
    timeoutMs: toPositiveInt(
      configService.get<string>('AI_PROVIDER_TIMEOUT_MS', '30000'),
      30000,
    ),
    maxRetries: toNonNegativeInt(
      configService.get<string>('AI_PROVIDER_MAX_RETRIES', '1'),
      1,
    ),
    strictJson: toBoolean(configService.get<string>('AI_JSON_STRICT', 'true')),
  };
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function toNonNegativeInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function toBoolean(value: string | undefined): boolean {
  const normalized = (value ?? '').toLowerCase().trim();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

