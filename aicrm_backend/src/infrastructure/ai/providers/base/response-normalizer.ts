import OpenAI from 'openai';
import { AIProviderError } from './ai-errors';

export function extractJsonContentFromCompletion(
  completion: OpenAI.Chat.Completions.ChatCompletion,
  provider: string,
): string {
  const message = completion.choices[0]?.message;
  const content = message?.content;

  if (typeof content === 'string') return content;

  throw new AIProviderError(
    'Provider response did not include string JSON content',
    provider,
    true,
  );
}

export function summarizeError(error: unknown): string {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error.slice(0, 240);
  if (error instanceof Error) return `${error.name}: ${error.message}`.slice(0, 240);
  return 'Non-standard error';
}

