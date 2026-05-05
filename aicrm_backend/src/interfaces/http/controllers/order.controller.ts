import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateOrderUseCase } from '../../../application/use-cases/create-order.use-case';
import { GetOrdersByCompanyUseCase } from '../../../application/use-cases/get-orders-by-company.use-case';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth')
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrdersByCompanyUseCase: GetOrdersByCompanyUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear pedido para la empresa autenticada' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Pedido creado correctamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.createOrderUseCase.execute({
      customerId: dto.customerId,
      companyId: user.companyId,
      items: dto.items,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar pedidos por empresa' })
  @ApiResponse({ status: 200, description: 'Listado de pedidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async list(@CurrentUser() user: CurrentUserPayload) {
    return this.getOrdersByCompanyUseCase.execute(user.companyId);
  }
}
