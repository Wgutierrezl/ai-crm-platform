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
import { GetCompanySettingsUseCase } from '../../../application/use-cases/get-company-settings.use-case';
import { StartCustomerGoogleOAuthUseCase } from '../../../application/use-cases/start-customer-google-oauth.use-case';
import { StartCustomerGoogleOauthDto } from '../dtos/start-customer-google-oauth.dto';

@ApiTags('Customers OAuth')
@Controller('customers/oauth/google')
export class CustomersOAuthController {
  private readonly logger = new Logger(CustomersOAuthController.name);

  constructor(
    private readonly startCustomerGoogleOAuthUseCase: StartCustomerGoogleOAuthUseCase,
    private readonly handleCustomerGoogleOAuthCallbackUseCase: HandleCustomerGoogleOAuthCallbackUseCase,
    private readonly getCompanySettingsUseCase: GetCompanySettingsUseCase,
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
      const branding = await this.resolveBranding(result.companyId);
      return res
        .status(200)
        .contentType('text/html')
        .send(this.renderHtml('Vinculacion completada', result.message, branding));
    } catch (error) {
      this.logger.warn(
        `[CustomerGoogleOAuth][Callback] failed reason=${error instanceof Error ? error.message : 'unknown'}`,
      );
      const branding = await this.resolveBranding(null);
      return res
        .status(200)
        .contentType('text/html')
        .send(
          this.renderHtml(
            'No se pudo completar',
            'No se pudo completar. Continua manualmente por WhatsApp.',
            branding,
          ),
        );
    }
  }

  private async resolveBranding(companyId: string | null): Promise<{ companyName: string; logoUrl: string | null }> {
    if (!companyId) return { companyName: 'AI CRM', logoUrl: null };
    try {
      const settings = await this.getCompanySettingsUseCase.execute(companyId);
      return {
        companyName: settings.companyName,
        logoUrl: settings.logoUrl,
      };
    } catch {
      return { companyName: 'AI CRM', logoUrl: null };
    }
  }

  private renderHtml(
    title: string,
    message: string,
    branding: { companyName: string; logoUrl: string | null },
  ): string {
    const logo = branding.logoUrl
      ? `<img src="${this.escapeHtml(branding.logoUrl)}" alt="${this.escapeHtml(branding.companyName)}" style="max-height:44px;max-width:170px;border-radius:6px;display:block;" />`
      : `<div style="display:inline-block;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.45);font-size:12px;font-weight:700;background:rgba(255,255,255,.12);">${this.escapeHtml(branding.companyName)}</div>`;
    return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${this.escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dbeafe;">
            <tr>
              <td style="padding:18px 22px;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#ffffff;">
                <div style="margin-bottom:12px;">${logo}</div>
                <h1 style="margin:0;font-size:20px;line-height:1.3;">${this.escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 22px;">
                <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;">${this.escapeHtml(message)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
