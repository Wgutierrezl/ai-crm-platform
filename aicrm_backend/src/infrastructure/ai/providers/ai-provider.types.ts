import { AIMessageInput, AIResponse } from '../../../domain/ports/ai.service.port';
import { AIProviderName } from '../config/ai-provider.config';

export interface AIProviderClient {
  readonly name: AIProviderName;
  getModel(): string;
  processMessage(input: AIMessageInput, strictJson: boolean): Promise<AIResponse>;
}

