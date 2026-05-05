import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'ACME S.A.S',
    description: 'Nombre de la empresa a registrar',
  })
  @IsString()
  companyName!: string;

  @ApiProperty({
    example: 'admin@acme.com',
    description: 'Email del usuario admin',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'SecurePass123',
    description: 'Contrasena del usuario (minimo 6 caracteres)',
  })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'CC', description: 'Tipo de identificacion' })
  @IsString()
  identificationType!: string;

  @ApiProperty({
    example: '123456789',
    description: 'Numero de identificacion',
  })
  @IsString()
  identificationNumber!: string;

  @ApiPropertyOptional({
    example: 'Juan Perez',
    description: 'Nombre completo del usuario',
  })
  @IsOptional()
  @IsString()
  fullName?: string;
}
