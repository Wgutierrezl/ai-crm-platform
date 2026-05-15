import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({ example: 'Sofia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  assistantName?: string | null;

  @ApiPropertyOptional({
    example: 'Somos una tienda de tecnologia orientada a pymes en Colombia.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  assistantContext?: string | null;

  @ApiPropertyOptional({
    example: 'Hola {{customerName}}, soy {{assistantName}}. Te ayudo con tu compra.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  assistantWelcomeMessage?: string | null;
}

