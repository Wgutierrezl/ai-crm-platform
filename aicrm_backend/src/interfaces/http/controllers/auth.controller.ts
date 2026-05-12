import { BadRequestException, Body, Controller, Get, Logger, Post, Query, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { StartGoogleLoginUseCase } from '../../../application/use-cases/start-google-login.use-case';
import { HandleGoogleCallbackUseCase } from '../../../application/use-cases/handle-google-callback.use-case';
import { ExchangeGoogleAuthCodeUseCase } from '../../../application/use-cases/exchange-google-auth-code.use-case';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { GoogleAuthExchangeDto } from '../dtos/google-auth-exchange.dto';
import type { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly startGoogleLoginUseCase: StartGoogleLoginUseCase,
    private readonly handleGoogleCallbackUseCase: HandleGoogleCallbackUseCase,
    private readonly exchangeGoogleAuthCodeUseCase: ExchangeGoogleAuthCodeUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar usuario administrador y empresa' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario y empresa registrados correctamente',
  })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(
      `Register request recibido para email=${dto.email}, companyName=${dto.companyName}`,
    );

    const result = await this.registerUserUseCase.execute(dto);

    this.logger.log(
      `Register exitoso userId=${result.userId}, companyId=${result.companyId}`,
    );

    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion y obtener JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Autenticacion correcta con token JWT',
  })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login request recibido para email=${dto.email}`);

    const result = await this.loginUserUseCase.execute(dto);

    this.logger.log(
      `Login exitoso userId=${result.userId}, companyId=${result.companyId}, role=${result.role}`,
    );

    return result;
  }

  @Get('google/start')
  @ApiOperation({ summary: 'Inicia autenticacion Google OAuth para usuarios internos' })
  @ApiResponse({ status: 302, description: 'Redireccion a Google OAuth' })
  async startGoogle(@Query('returnTo') returnTo: string | undefined, @Res() res: Response) {
    this.logger.log(
      `[GoogleOAuth][Start] request received returnToPresent=${Boolean(returnTo)}`,
    );
    const result = await this.startGoogleLoginUseCase.execute();
    this.logger.log(
      `[GoogleOAuth][Start] redirect ready url=${this.maskUrl(result.authorizationUrl)}`,
    );
    return res.redirect(result.authorizationUrl);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Callback OAuth de Google para usuarios internos' })
  @ApiResponse({ status: 302, description: 'Redireccion a frontend success/failure' })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[GoogleOAuth][Callback] callback received hasCode=${Boolean(code)} hasState=${Boolean(state)} code=${this.maskValue(code)} state=${this.maskValue(state)}`,
    );
    try {
      const result = await this.handleGoogleCallbackUseCase.execute({ code, state });
      this.logger.log(
        `[GoogleOAuth][Callback] success redirect=${this.maskUrl(result.redirectUrl)}`,
      );
      return res.redirect(result.redirectUrl);
    } catch (error) {
      this.logger.error(
        `[GoogleOAuth][Callback] failed message=${error instanceof Error ? error.message : 'unknown'}`,
        error instanceof Error ? error.stack : undefined,
      );
      const fallback = process.env.GOOGLE_OAUTH_FAILURE_REDIRECT_URL || '/login';
      const safeReason = encodeURIComponent('oauth_callback_failed');
      this.logger.warn(
        `[GoogleOAuth][Callback] fallback redirect=${this.maskUrl(fallback)}`,
      );
      return res.redirect(`${fallback}${fallback.includes('?') ? '&' : '?'}reason=${safeReason}`);
    }
  }

  @Post('google/exchange')
  @ApiOperation({ summary: 'Intercambia auth_code temporal por JWT del backend' })
  @ApiBody({ type: GoogleAuthExchangeDto })
  @ApiResponse({ status: 201, description: 'JWT emitido correctamente' })
  async googleExchange(@Body() dto: GoogleAuthExchangeDto) {
    const incomingCode = String(dto.authCode ?? dto.code ?? '').trim();
    const selectedField = dto.authCode ? 'authCode' : dto.code ? 'code' : 'none';
    this.logger.log(
      `[GoogleOAuth][Exchange] request received hasAuthCode=${Boolean(dto.authCode)} hasCode=${Boolean(dto.code)} selectedField=${selectedField} code=${this.maskValue(incomingCode)}`,
    );
    if (!incomingCode) {
      this.logger.warn(
        `[GoogleOAuth][Exchange] invalid payload missing auth code hasAuthCode=${Boolean(dto.authCode)} hasCode=${Boolean(dto.code)}`,
      );
      throw new BadRequestException('authCode is required');
    }
    const response = await this.exchangeGoogleAuthCodeUseCase.execute({ code: incomingCode });
    this.logger.log(
      `[GoogleOAuth][Exchange] response success userId=${this.maskValue(response.userId)} companyId=${this.maskValue(response.companyId)} role=${response.role} jwt=${this.maskValue(response.accessToken)}`,
    );
    return response;
  }

  private maskValue(value: string | null | undefined): string {
    const input = String(value ?? '').trim();
    if (!input) return 'empty';
    if (input.length <= 8) return `${input.slice(0, 2)}***${input.slice(-1)}`;
    return `${input.slice(0, 4)}...${input.slice(-4)}`;
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const code = parsed.searchParams.get('code');
      const state = parsed.searchParams.get('state');
      if (code) parsed.searchParams.set('code', this.maskValue(code));
      if (state) parsed.searchParams.set('state', this.maskValue(state));
      return parsed.toString();
    } catch {
      return this.maskValue(url);
    }
  }
}
