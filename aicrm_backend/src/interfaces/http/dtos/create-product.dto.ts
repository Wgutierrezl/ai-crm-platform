import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop Pro 14', description: 'Nombre del producto' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Laptop de 14 pulgadas para trabajo y estudio' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 4999.99, description: 'Precio del producto' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 50, description: 'Stock disponible' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stock!: number;

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
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
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 'https://example.com/laptop.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: '0d8e9965-ecbc-4d86-9038-7487c35a613b',
    description: 'Categoria opcional del producto',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
