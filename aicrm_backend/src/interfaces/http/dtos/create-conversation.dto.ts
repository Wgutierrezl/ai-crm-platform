import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    example: 'c9c4e13b-95ca-4f6e-99f0-53d716f2f551',
    description: 'ID del cliente asociado a la conversacion',
  })
  @IsString()
  customerId!: string;
}
