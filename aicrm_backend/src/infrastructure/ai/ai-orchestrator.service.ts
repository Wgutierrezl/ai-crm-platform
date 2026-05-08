import { Injectable, Logger } from '@nestjs/common';
import {
  AIMessageInput,
  AIResponse,
  AIService,
} from '../../domain/ports/ai.service.port';
import {
  AIProviderRuntimeConfig,
  loadAIProviderRuntimeConfig,
} from './config/ai-provider.config';
import { AIProviderResolver } from './providers/ai-provider.resolver';
import { isTechnicalAIError } from './providers/base/ai-errors';
import { summarizeError } from './providers/base/response-normalizer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AIOrchestratorService implements AIService {
  private readonly logger = new Logger(AIOrchestratorService.name);
  private readonly runtimeConfig: AIProviderRuntimeConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly resolver: AIProviderResolver,
  ) {
    this.runtimeConfig = loadAIProviderRuntimeConfig(this.configService);
  }

  async processMessage(input: AIMessageInput): Promise<AIResponse> {
    const primary = this.resolver.getProvider(this.runtimeConfig.primary);
    const fallback =
      this.runtimeConfig.fallback !== 'none'
        ? this.resolver.getProvider(this.runtimeConfig.fallback)
        : null;

    try {
      return await this.runProvider(primary, input, false);
    } catch (error) {
      const primaryError = summarizeError(error);
      const canFallback =
        fallback &&
        fallback.name !== primary.name &&
        isTechnicalAIError(error) &&
        this.runtimeConfig.fallback !== 'none';

      if (!canFallback) {
        this.logger.warn(
          `AI provider failed without fallback provider=${primary.name} error="${primaryError}"`,
        );
        return {
          reply:
            'Perdon, tuve un problema tecnico. Intentalo de nuevo en unos segundos.',
        };
      }

      try {
        const response = await this.runProvider(fallback, input, true);
        this.logger.warn(
          `AI fallback success primary=${primary.name} fallback=${fallback.name} primaryError="${primaryError}"`,
        );
        return response;
      } catch (fallbackError) {
        this.logger.error(
          `AI fallback failed primary=${primary.name} fallback=${fallback.name} primaryError="${primaryError}" fallbackError="${summarizeError(fallbackError)}"`,
        );
        return {
          reply:
            'Perdon, tuve un problema tecnico. Intentalo de nuevo en unos segundos.',
        };
      }
    }
  }

  private async runProvider(
    provider: ReturnType<AIProviderResolver['getProvider']>,
    input: AIMessageInput,
    usedFallback: boolean,
  ): Promise<AIResponse> {
    const startedAt = Date.now();
    let attempt = 0;
    const maxAttempts = this.runtimeConfig.maxRetries + 1;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const response = await this.withTimeout(
          provider.processMessage(input, this.runtimeConfig.strictJson),
          this.runtimeConfig.timeoutMs,
          provider.name,
        );
        this.logger.log(
          `AI request ok provider=${provider.name} model=${provider.getModel()} durationMs=${Date.now() - startedAt} fallback=${usedFallback} attempt=${attempt}`,
        );
        return response;
      } catch (error) {
        lastError = error;
        const technical = isTechnicalAIError(error);
        this.logger.warn(
          `AI request failed provider=${provider.name} model=${provider.getModel()} durationMs=${Date.now() - startedAt} fallback=${usedFallback} attempt=${attempt} technical=${technical} error="${summarizeError(error)}"`,
        );
        if (!technical || attempt >= maxAttempts) break;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Unknown AI provider execution error');
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    provider: string,
  ): Promise<T> {
    let timeoutHandle: NodeJS.Timeout | undefined;
    const timeoutPromise = new Promise<T>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms for provider=${provider}`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }
}

