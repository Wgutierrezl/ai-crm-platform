import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop Pro 14', description: 'Nombre del producto' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Laptop de 14 pulgadas para trabajo y estudio' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 4999.99, description: 'Precio del producto' })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 50, description: 'Stock disponible' })
  @IsNumber()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'SKU-LAP-001' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'Lenovo' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 'COP' })
  @IsOptional()
  @IsString()
  @Length(3, 10)
  currency?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 'https://example.com/laptop.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
