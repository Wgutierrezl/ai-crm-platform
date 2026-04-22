import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    example: '3f404ca5-657e-4d0f-b4af-9ce0139a95f2',
    description: 'ID de la conversacion',
  })
  @IsString()
  conversationId!: string;

  @ApiProperty({
    example: 'Hola, quiero comprar 2 laptops.',
    description: 'Contenido del mensaje',
  })
  @IsString()
  content!: string;
}
