import { Injectable } from '@nestjs/common';
import { AIProviderName } from '../config/ai-provider.config';
import { AIProviderClient } from './ai-provider.types';
import { OpenAIProvider } from './openai.provider';
import { GroqProvider } from './groq.provider';
import { OllamaProvider } from './ollama.provider';

@Injectable()
export class AIProviderResolver {
  constructor(
    private readonly openaiProvider: OpenAIProvider,
    private readonly groqProvider: GroqProvider,
    private readonly ollamaProvider: OllamaProvider,
  ) {}

  getProvider(name: AIProviderName): AIProviderClient {
    if (name === 'groq') return this.groqProvider;
    if (name === 'ollama') return this.ollamaProvider;
    return this.openaiProvider;
  }
}

