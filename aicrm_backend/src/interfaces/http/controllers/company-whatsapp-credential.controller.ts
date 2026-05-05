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
import { UpsertCompanyWhatsappCredentialUseCase } from '../../../application/use-cases/upsert-company-whatsapp-credential.use-case';
import { UpsertCompanyWhatsappCredentialDto } from '../dtos/upsert-company-whatsapp-credential.dto';

@ApiTags('Company WhatsApp Credentials')
@Controller('company-whatsapp-credentials')
export class CompanyWhatsappCredentialController {
  private readonly logger = new Logger(
    CompanyWhatsappCredentialController.name,
  );

  constructor(
    private readonly configService: ConfigService,
    private readonly upsertUseCase: UpsertCompanyWhatsappCredentialUseCase,
  ) {}

  @Post()
  @ApiOperation({
    summary:
      'Endpoint interno para registrar/actualizar credenciales de WhatsApp por app',
    description:
      'Endpoint interno protegido por API Key. No exponer publicamente.',
  })
  @ApiHeader({
    name: 'X-Internal-Api-Key',
    required: true,
    description: 'API key interna configurada en INTERNAL_API_KEY',
  })
  @ApiBody({ type: UpsertCompanyWhatsappCredentialDto })
  @ApiResponse({
    status: 201,
    description: 'Credencial creada/actualizada correctamente',
  })
  @ApiResponse({ status: 401, description: 'API key invalida' })
  async upsert(
    @Headers('x-internal-api-key') internalApiKey: string | undefined,
    @Body() dto: UpsertCompanyWhatsappCredentialDto,
  ) {
    const expectedApiKey = this.configService.get<string>('INTERNAL_API_KEY');
    if (
      !expectedApiKey ||
      !internalApiKey ||
      internalApiKey !== expectedApiKey
    ) {
      this.logger.warn(
        'Intento no autorizado de upsert de credencial WhatsApp',
      );
      throw new UnauthorizedException('API key interna invalida');
    }

    this.logger.log(
      `Solicitud upsert credenciales WhatsApp whatsappAppId=${dto.whatsappAppId}`,
    );

    return this.upsertUseCase.execute(dto);
  }
}
