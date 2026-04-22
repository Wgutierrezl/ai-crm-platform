import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Laptop Pro 14', description: 'Nombre del producto' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 4999.99, description: 'Precio del producto' })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ example: 50, description: 'Stock disponible' })
  @IsNumber()
  @Min(0)
  stock!: number;
}
