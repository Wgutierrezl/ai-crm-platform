import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AIMessageInput, AIResponse } from '../../../domain/ports/ai.service.port';
import { AIProviderClient } from './ai-provider.types';
import { buildChatMessages } from './base/prompt-builder';
import { extractJsonContentFromCompletion } from './base/response-normalizer';
import { validateAndBuildAIResponse } from './base/ai-json-validator';
import { AIProviderError } from './base/ai-errors';

@Injectable()
export class OpenAIProvider implements AIProviderClient {
  readonly name = 'openai' as const;
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    this.client = new OpenAI({ apiKey });
  }

  getModel(): string {
    return this.model;
  }

  async processMessage(
    input: AIMessageInput,
    strictJson: boolean,
  ): Promise<AIResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: buildChatMessages(input),
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });
      const raw = extractJsonContentFromCompletion(completion, this.name);
      return validateAndBuildAIResponse(raw, strictJson, this.name);
    } catch (error: any) {
      const statusCode =
        typeof error?.status === 'number' ? Number(error.status) : undefined;
      const technical =
        statusCode === undefined ||
        statusCode === 408 ||
        statusCode === 429 ||
        statusCode >= 500;
      throw new AIProviderError(
        `OpenAI request failed (${statusCode ?? 'unknown'})`,
        this.name,
        technical,
        statusCode,
      );
    }
  }
}
