import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIService } from './openai.service';
import { AIService } from '../../domain/ports/ai.service.port';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: AIService,
      useClass: OpenAIService,
    },
  ],
  exports: [AIService],
})
export class AiModule {}
