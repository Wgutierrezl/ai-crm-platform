import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

export class UpdateSupplierDto {
  @ApiPropertyOptional({ example: 'Distribuciones Andinas SAS' })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  name?: string;

  @ApiPropertyOptional({ example: 'NIT', nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 30)
  documentType?: string | null;

  @ApiPropertyOptional({ example: '900123456-7', nullable: true })
  @IsOptional()
  @IsString()
  @Length(3, 80)
  documentNumber?: string | null;

  @ApiPropertyOptional({ example: 'Laura Pérez', nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 160)
  contactName?: string | null;

  @ApiPropertyOptional({ example: '+57 3001234567', nullable: true })
  @IsOptional()
  @IsString()
  @Length(7, 40)
  phone?: string | null;

  @ApiPropertyOptional({ example: 'compras@andinas.com', nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;

  @ApiPropertyOptional({ example: 'Calle 80 # 10-20', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;

  @ApiPropertyOptional({ example: 'Bogota', nullable: true })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  city?: string | null;

  @ApiPropertyOptional({ example: 'Proveedor principal', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

