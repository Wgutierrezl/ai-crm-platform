import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpsertCompanyWhatsappAppDto {
  @ApiProperty({
    example: 'AI CRM Demo WhatsApp',
    description: 'Nombre interno de la app/numero de WhatsApp',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: '123456789012345',
    description: 'phone_number_id de Meta WhatsApp Cloud API',
  })
  @IsString()
  phoneNumberId!: string;

  @ApiProperty({
    example: '987654321000111',
    description: 'ID de la cuenta de negocio (WABA) en Meta',
  })
  @IsString()
  businessAccountId!: string;

  @ApiPropertyOptional({
    example: '345678901234567',
    description: 'App ID de Meta (opcional)',
  })
  @IsOptional()
  @IsString()
  appId?: string;

  @ApiPropertyOptional({
    example: '+573001112233',
    description: 'Numero visible del WhatsApp conectado (opcional)',
  })
  @IsOptional()
  @IsString()
  displayPhoneNumber?: string;
}
