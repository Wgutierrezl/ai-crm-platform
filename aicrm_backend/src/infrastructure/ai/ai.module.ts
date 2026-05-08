import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { AIService } from '../../domain/ports/ai.service.port';
import { OpenAIProvider } from './providers/openai.provider';
import { GroqProvider } from './providers/groq.provider';
import { OllamaProvider } from './providers/ollama.provider';
import { AIProviderResolver } from './providers/ai-provider.resolver';
import { AIOrchestratorService } from './ai-orchestrator.service';

@Module({
  imports: [ConfigModule],
  providers: [
    OpenAIProvider,
    GroqProvider,
    OllamaProvider,
    AIProviderResolver,
    OpenAIService,
    AIOrchestratorService,
    {
      provide: AIService,
      useExisting: AIOrchestratorService,
    },
  ],
  exports: [AIService],
})
export class AiModule {}
