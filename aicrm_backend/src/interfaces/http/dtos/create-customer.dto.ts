import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({
    example: 'Maria Gonzalez',
    description: 'Nombre del cliente',
    required: true,
  })
  @IsString()
  name!: string;

  @ApiProperty({
    example: '+573001234567',
    description: 'Telefono del cliente',
    required: true,
  })
  @IsString()
  phone!: string;

  @ApiProperty({
    example: 'maria@email.com',
    description: 'Email del cliente',
    required: true,
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'CC', description: 'Tipo de identificacion' })
  @IsOptional()
  @IsString()
  identificationType?: string;

  @ApiPropertyOptional({
    example: '1234567890',
    description: 'Numero de identificacion',
  })
  @IsOptional()
  @IsString()
  identificationNumber?: string;
}
