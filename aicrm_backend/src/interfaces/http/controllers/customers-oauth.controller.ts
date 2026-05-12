import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { HandleCustomerGoogleOAuthCallbackUseCase } from '../../../application/use-cases/handle-customer-google-oauth-callback.use-case';
import { StartCustomerGoogleOAuthUseCase } from '../../../application/use-cases/start-customer-google-oauth.use-case';
import { StartCustomerGoogleOauthDto } from '../dtos/start-customer-google-oauth.dto';

@ApiTags('Customers OAuth')
@Controller('customers/oauth/google')
export class CustomersOAuthController {
  private readonly logger = new Logger(CustomersOAuthController.name);

  constructor(
    private readonly startCustomerGoogleOAuthUseCase: StartCustomerGoogleOAuthUseCase,
    private readonly handleCustomerGoogleOAuthCallbackUseCase: HandleCustomerGoogleOAuthCallbackUseCase,
  ) {}

  @Post('start')
  @ApiOperation({ summary: 'Inicia OAuth Google para customer de WhatsApp' })
  @ApiBody({ type: StartCustomerGoogleOauthDto })
  @ApiResponse({ status: 201, description: 'URL de autorizacion generada' })
  async start(@Body() dto: StartCustomerGoogleOauthDto) {
    const result = await this.startCustomerGoogleOAuthUseCase.execute(dto);
    this.logger.log(
      `[CustomerGoogleOAuth][Start] customerId=${dto.customerId} conversationId=${dto.conversationId} expiresAt=${result.expiresAt.toISOString()}`,
    );
    return result;
  }

  @Get('callback')
  @ApiOperation({ summary: 'Callback OAuth Google para customers WhatsApp' })
  @ApiQuery({ name: 'code', required: false })
  @ApiQuery({ name: 'state', required: false })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[CustomerGoogleOAuth][Callback] callback received hasCode=${Boolean(code)} hasState=${Boolean(state)}`,
    );
    try {
      const result = await this.handleCustomerGoogleOAuthCallbackUseCase.execute({
        code: String(code ?? ''),
        state: String(state ?? ''),
      });
      return res
        .status(200)
        .contentType('text/html')
        .send(this.renderHtml('Vinculacion completada', result.message));
    } catch (error) {
      this.logger.warn(
        `[CustomerGoogleOAuth][Callback] failed reason=${error instanceof Error ? error.message : 'unknown'}`,
      );
      return res
        .status(200)
        .contentType('text/html')
        .send(
          this.renderHtml(
            'No se pudo completar',
            'No se pudo completar. Continua manualmente por WhatsApp.',
          ),
        );
    }
  }

  private renderHtml(title: string, message: string): string {
    return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body style="font-family:Arial,sans-serif;padding:24px;"><h1 style="font-size:20px;">${title}</h1><p style="font-size:16px;">${message}</p></body></html>`;
  }
}
