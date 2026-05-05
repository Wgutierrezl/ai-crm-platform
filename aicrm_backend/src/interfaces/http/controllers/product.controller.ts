import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductUseCase } from '../../../application/use-cases/create-product.use-case';
import { GetProductsByCompanyUseCase } from '../../../application/use-cases/get-products-by-company.use-case';
import { CreateProductDto } from '../dtos/create-product.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductsByCompanyUseCase: GetProductsByCompanyUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear producto para la empresa autenticada' })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({ status: 201, description: 'Producto creado correctamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateProductDto,
  ) {
    return this.createProductUseCase.execute({
      ...dto,
      companyId: user.companyId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos por empresa' })
  @ApiResponse({ status: 200, description: 'Listado de productos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.getProductsByCompanyUseCase.execute(user.companyId);
  }
}
