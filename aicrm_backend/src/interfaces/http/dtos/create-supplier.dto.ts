import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Distribuciones Andinas SAS' })
  @IsString()
  @Length(2, 160)
  name!: string;

  @ApiPropertyOptional({ example: 'NIT' })
  @IsOptional()
  @IsString()
  @Length(2, 30)
  documentType?: string;

  @ApiPropertyOptional({ example: '900123456-7' })
  @IsOptional()
  @IsString()
  @Length(3, 80)
  documentNumber?: string;

  @ApiPropertyOptional({ example: 'Laura Pérez' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  contactName?: string;

  @ApiPropertyOptional({ example: '+57 3001234567' })
  @IsOptional()
  @IsString()
  @Length(7, 40)
  phone?: string;

  @ApiPropertyOptional({ example: 'compras@andinas.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: 'Calle 80 # 10-20' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'Bogota' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  city?: string;

  @ApiPropertyOptional({ example: 'Proveedor principal para portátiles' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

