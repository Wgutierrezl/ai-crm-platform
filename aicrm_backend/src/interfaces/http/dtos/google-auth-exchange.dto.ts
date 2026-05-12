import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GoogleAuthExchangeDto {
  @ApiPropertyOptional({
    description: 'Codigo temporal one-time emitido por callback OAuth (legacy)',
    example: 'authcode_abc123',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Codigo temporal one-time emitido por callback OAuth (preferido)',
    example: 'authcode_abc123',
  })
  @IsOptional()
  @IsString()
  authCode?: string;
}
