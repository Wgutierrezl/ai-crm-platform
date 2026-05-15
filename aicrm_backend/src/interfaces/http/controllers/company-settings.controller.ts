import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetCompanySettingsUseCase } from '../../../application/use-cases/get-company-settings.use-case';
import { UpdateCompanySettingsUseCase } from '../../../application/use-cases/update-company-settings.use-case';
import { UpdateCompanySettingsDto } from '../dtos/update-company-settings.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';

@ApiTags('Company')
@ApiBearerAuth('JWT-auth')
@Controller('company')
@UseGuards(JwtAuthGuard)
export class CompanySettingsController {
  constructor(
    private readonly getCompanySettingsUseCase: GetCompanySettingsUseCase,
    private readonly updateCompanySettingsUseCase: UpdateCompanySettingsUseCase,
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
    });
  }

  private toNullable(value: string | null | undefined): string | null | undefined {
    if (value === undefined) return undefined;
    const trimmed = String(value ?? '').trim();
    return trimmed.length === 0 ? null : trimmed;
  }
}

