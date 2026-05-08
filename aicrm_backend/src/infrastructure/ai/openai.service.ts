import { Injectable } from '@nestjs/common';
import { OpenAIProvider } from './providers/openai.provider';

/**
 * Backward-compatible OpenAI service class.
 * Multi-provider orchestration now happens in AIOrchestratorService.
 */
@Injectable()
export class OpenAIService extends OpenAIProvider {}
