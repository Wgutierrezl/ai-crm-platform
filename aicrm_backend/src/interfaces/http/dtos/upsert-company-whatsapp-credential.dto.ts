import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertCompanyWhatsappCredentialDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la app de WhatsApp registrada',
  })
  @IsInt()
  @Min(1)
  whatsappAppId!: number;

  @ApiProperty({
    example: 'EAAGxxxxxxxxxxxxxxxx',
    description: 'Access token para llamadas a Graph API',
  })
  @IsString()
  accessToken!: string;

  @ApiProperty({
    example: 'mi_verify_token_seguro',
    description: 'Token de verificacion para webhook de Meta',
  })
  @IsString()
  verifyToken!: string;

  @ApiPropertyOptional({
    example: 'abc123secret',
    description: 'App secret de Meta (opcional)',
  })
  @IsOptional()
  @IsString()
  appSecret?: string;
}
