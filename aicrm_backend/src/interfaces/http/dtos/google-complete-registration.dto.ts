import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleCompleteRegistrationDto {
  @ApiPropertyOptional({
    description: 'Token temporal de registro retornado por exchange',
    example: '8f90c668-4a9b-4e2d-b314-a40fca2436e0',
  })
  @IsOptional()
  @IsString()
  registrationToken?: string;

  @ApiPropertyOptional({
    description: 'Compatibilidad: authCode de registro (UUID de sesion)',
    example: '8f90c668-4a9b-4e2d-b314-a40fca2436e0',
  })
  @IsOptional()
  @IsString()
  authCode?: string;

  @ApiProperty({ example: 'ACME S.A.S', description: 'Nombre de la empresa' })
  @IsString()
  @MinLength(2)
  companyName!: string;

  @ApiProperty({ example: 'NIT', enum: ['CC', 'NIT'] })
  @IsString()
  @IsIn(['CC', 'NIT'])
  identificationType!: 'CC' | 'NIT';

  @ApiProperty({ example: '901234567' })
  @IsString()
  @MinLength(4)
  identificationNumber!: string;
}

