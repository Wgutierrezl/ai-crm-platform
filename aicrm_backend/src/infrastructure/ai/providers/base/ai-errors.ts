export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly technical: boolean,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export function isTechnicalAIError(error: unknown): boolean {
  if (error instanceof AIProviderError) return error.technical;
  return true;
}

