import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCustomerUseCase } from '../../../application/use-cases/create-customer.use-case';
import { GetCustomersByCompanyUseCase } from '../../../application/use-cases/get-customers-by-company.use-case';
import { GetCustomerByIdUseCase } from '../../../application/use-cases/get-customer-by-id.use-case';
import { CreateCustomerDto } from '../dtos/create-customer.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
@UseGuards(JwtAuthGuard)
export class CustomerController {
  private readonly logger = new Logger(CustomerController.name);

  constructor(
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    private readonly getCustomersByCompanyUseCase: GetCustomersByCompanyUseCase,
    private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear cliente para la empresa autenticada' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, description: 'Cliente creado correctamente' })
  @ApiResponse({ status: 400, description: 'Datos de entrada invalidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCustomerDto,
  ) {
    try {
      this.logger.log(`Creating customer request for companyId=${user.companyId}`);

      const customer = await this.createCustomerUseCase.execute({
        ...dto,
        companyId: user.companyId,
      });

      this.logger.log(`Customer created id=${customer.id}, companyId=${customer.companyId}`);
      return customer;
    } catch (error) {
      this.logger.error(
        `Error creating customer for companyId=${user.companyId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes por empresa' })
  @ApiResponse({ status: 200, description: 'Listado de clientes' })
  @ApiResponse({ status: 400, description: 'Solicitud invalida' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    try {
      this.logger.log(`Listing customers for companyId=${user.companyId}`);
      const customers = await this.getCustomersByCompanyUseCase.execute(user.companyId);
      this.logger.log(`Listed customers count=${customers.length} for companyId=${user.companyId}`);
      return customers;
    } catch (error) {
      this.logger.error(
        `Error listing customers for companyId=${user.companyId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar cliente por ID' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 400, description: 'ID de cliente invalido' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    try {
      this.logger.log(`Finding customer id=${id}, companyId=${user.companyId}`);
      const customer = await this.getCustomerByIdUseCase.execute(id, user.companyId);
      this.logger.log(`Customer found id=${customer.id}, companyId=${customer.companyId}`);
      return customer;
    } catch (error) {
      this.logger.error(
        `Error finding customer id=${id}, companyId=${user.companyId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
