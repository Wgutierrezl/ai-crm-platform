import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, IsUUID, Length } from 'class-validator';

export class StartCustomerGoogleOauthDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  conversationId: string;

  @ApiProperty({ enum: ['whatsapp'] })
  @IsIn(['whatsapp'])
  channel: 'whatsapp';

  @ApiProperty({ description: 'wa_id del cliente en WhatsApp' })
  @IsString()
  @Length(1, 120)
  externalUserId: string;
}

