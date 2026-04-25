import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar usuario administrador y empresa' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Usuario y empresa registrados correctamente',
  })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(
      `Register request recibido para email=${dto.email}, companyName=${dto.companyName}`,
    );

    const result = await this.registerUserUseCase.execute(dto);

    this.logger.log(
      `Register exitoso userId=${result.userId}, companyId=${result.companyId}`,
    );

    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesion y obtener JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Autenticacion correcta con token JWT',
  })
  @ApiResponse({ status: 401, description: 'Credenciales invalidas' })
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login request recibido para email=${dto.email}`);

    const result = await this.loginUserUseCase.execute(dto);

    this.logger.log(
      `Login exitoso userId=${result.userId}, companyId=${result.companyId}, role=${result.role}`,
    );

    return result;
  }
}
