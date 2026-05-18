import {
  Body,
  Controller,
  Get,
  ParseFilePipeBuilder,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetCompanySettingsUseCase } from '../../../application/use-cases/get-company-settings.use-case';
import { UpdateCompanySettingsUseCase } from '../../../application/use-cases/update-company-settings.use-case';
import { UpdateCompanySettingsDto } from '../dtos/update-company-settings.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';
import { ImageStoragePort } from '../../../domain/ports/image-storage.port';

@ApiTags('Company')
@ApiBearerAuth('JWT-auth')
@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanySettingsController {
  constructor(
    private readonly getCompanySettingsUseCase: GetCompanySettingsUseCase,
    private readonly updateCompanySettingsUseCase: UpdateCompanySettingsUseCase,
    private readonly imageStorage: ImageStoragePort,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Obtener configuracion del asistente de la empresa autenticada' })
  @ApiResponse({ status: 200, description: 'Configuracion de empresa obtenida' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async getSettings(@CurrentUser() user: CurrentUserPayload) {
    return this.getCompanySettingsUseCase.execute(user.companyId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Actualizar configuracion del asistente de la empresa autenticada' })
  @ApiResponse({ status: 200, description: 'Configuracion de empresa actualizada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Empresa no encontrada' })
  async updateSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateCompanySettingsDto,
  ) {
    return this.updateCompanySettingsUseCase.execute({
      companyId: user.companyId,
      assistantName: this.toNullable(dto.assistantName),
      assistantContext: this.toNullable(dto.assistantContext),
      assistantWelcomeMessage: this.toNullable(dto.assistantWelcomeMessage),
      logoUrl: this.toNullable(dto.logoUrl),
    });
  }

  @Patch('settings/logo')
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Subir y guardar logo corporativo de la empresa autenticada' })
  @ApiResponse({ status: 200, description: 'Logo corporativo actualizado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async uploadLogo(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /image\/(jpeg|jpg|png|webp|gif|avif|svg\+xml)/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ fileIsRequired: true }),
    )
    logo: Express.Multer.File,
  ) {
    const uploaded = await this.imageStorage.uploadImage({
      fileBuffer: logo.buffer,
      fileName: logo.originalname,
      mimeType: logo.mimetype,
      folder: `${user.companyId}/branding`,
    });

    return this.updateCompanySettingsUseCase.execute({
      companyId: user.companyId,
      logoUrl: uploaded.secureUrl,
    });
  }

  private toNullable(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    const trimmed = String(value ?? '').trim();
    return trimmed.length === 0 ? null : trimmed;
  }
}

