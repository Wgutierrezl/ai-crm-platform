import {
  IsArray,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    example: '1d89f6d8-f6d5-4709-9f70-36f9e7ef1a35',
    description: 'ID del producto',
  })
  @IsString()
  productId!: string;

  @ApiProperty({ example: 2, description: 'Cantidad del producto' })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 4999.99, description: 'Precio unitario del producto' })
  @IsNumber()
  @Min(0)
  price!: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: '45d0a8d6-f3f4-4896-b4bd-70d7ebc43861',
    description: 'ID del cliente',
  })
  @IsString()
  customerId!: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    description: 'Lista de items del pedido',
    example: [
      {
        productId: '1d89f6d8-f6d5-4709-9f70-36f9e7ef1a35',
        quantity: 2,
        price: 4999.99,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
