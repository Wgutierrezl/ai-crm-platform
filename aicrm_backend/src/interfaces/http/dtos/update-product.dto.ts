import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Laptop Lenovo ThinkPad X1' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Portatil empresarial de alto rendimiento' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 5200000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 'SKU-LEN-001' })
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional({ example: 'Lenovo' })
  @IsOptional()
  @IsString()
  brand?: string | null;

  @ApiPropertyOptional({ example: 'COP' })
  @IsOptional()
  @IsString()
  @Length(3, 10)
  currency?: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/laptop.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: '0d8e9965-ecbc-4d86-9038-7487c35a613b',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}

