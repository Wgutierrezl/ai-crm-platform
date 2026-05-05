import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@acme.com', description: 'Email de acceso' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'SecurePass123',
    description: 'Contrasena de acceso',
  })
  @IsString()
  password!: string;
}
