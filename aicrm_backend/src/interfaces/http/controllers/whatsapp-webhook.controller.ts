import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { HandleWhatsappWebhookUseCase } from '../../../application/use-cases/handle-whatsapp-webhook.use-case';
import { ValidateMetaWebhookSignatureUseCase } from '../../../application/use-cases/validate-meta-webhook-signature.use-case';
import { VerifyWhatsappWebhookUseCase } from '../../../application/use-cases/verify-whatsapp-webhook.use-case';

@ApiTags('WhatsApp Webhook')
@Controller('webhooks/whatsapp')
export class WhatsappWebhookController {
  private readonly logger = new Logger(WhatsappWebhookController.name);

  constructor(
    private readonly verifyWebhookUseCase: VerifyWhatsappWebhookUseCase,
    private readonly handleWebhookUseCase: HandleWhatsappWebhookUseCase,
    private readonly validateSignatureUseCase: ValidateMetaWebhookSignatureUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verificacion webhook de Meta WhatsApp Cloud API' })
  @ApiQuery({ name: 'hub.mode', required: false })
  @ApiQuery({ name: 'hub.verify_token', required: false })
  @ApiQuery({ name: 'hub.challenge', required: false })
  @ApiResponse({
    status: 200,
    description: 'Challenge retornado correctamente',
  })
  @ApiResponse({ status: 403, description: 'Token de verificacion invalido' })
  async verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') verifyToken?: string,
    @Query('hub.challenge') challenge?: string,
  ): Promise<string> {
    this.logger.log('Solicitud de verificacion webhook recibida');
    return this.verifyWebhookUseCase.execute({ mode, verifyToken, challenge });
  }

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Recepcion de eventos/mensajes de WhatsApp desde Meta',
  })
  @ApiResponse({ status: 200, description: 'Webhook procesado correctamente' })
  async receive(
    @Body() payload: unknown,
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('x-hub-signature-256') signatureHeader?: string,
  ): Promise<{ ok: true }> {
    await this.validateSignatureUseCase.execute({
      rawBody: req.rawBody,
      payload,
      signatureHeader,
    });
    await this.handleWebhookUseCase.execute(payload);
    return { ok: true };
  }
}
