import {
  Body,
  Controller,
  Headers,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UpsertCompanyWhatsappAppUseCase } from '../../../application/use-cases/upsert-company-whatsapp-app.use-case';
import { UpsertCompanyWhatsappAppDto } from '../dtos/upsert-company-whatsapp-app.dto';

@ApiTags('Company WhatsApp Apps')
@Controller('company-whatsapp-apps')
export class CompanyWhatsappAppController {
  private readonly logger = new Logger(CompanyWhatsappAppController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly upsertUseCase: UpsertCompanyWhatsappAppUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Endpoint interno para registrar/actualizar app de WhatsApp',
    description:
      'Endpoint interno protegido por API Key. No exponer publicamente.',
  })
  @ApiHeader({
    name: 'X-Internal-Api-Key',
    required: true,
    description: 'API key interna configurada en INTERNAL_API_KEY',
  })
  @ApiBody({ type: UpsertCompanyWhatsappAppDto })
  @ApiResponse({
    status: 201,
    description: 'App de WhatsApp creada/actualizada correctamente',
  })
  @ApiResponse({ status: 401, description: 'API key invalida' })
  async upsert(
    @Headers('x-internal-api-key') internalApiKey: string | undefined,
    @Body() dto: UpsertCompanyWhatsappAppDto,
  ) {
    const expectedApiKey = this.configService.get<string>('INTERNAL_API_KEY');
    if (
      !expectedApiKey ||
      !internalApiKey ||
      internalApiKey !== expectedApiKey
    ) {
      this.logger.warn('Intento no autorizado de upsert de app WhatsApp');
      throw new UnauthorizedException('API key interna invalida');
    }

    this.logger.log(
      `Solicitud upsert app WhatsApp phoneNumberId=${dto.phoneNumberId}`,
    );

    return this.upsertUseCase.execute(dto);
  }
}
