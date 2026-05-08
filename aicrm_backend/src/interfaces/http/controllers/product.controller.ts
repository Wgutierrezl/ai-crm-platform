import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateProductUseCase } from '../../../application/use-cases/create-product.use-case';
import { GetProductsByCompanyUseCase } from '../../../application/use-cases/get-products-by-company.use-case';
import { UpdateProductUseCase } from '../../../application/use-cases/update-product.use-case';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
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
    private readonly updateProductUseCase: UpdateProductUseCase,
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

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto de la empresa autenticada' })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Producto actualizado correctamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.updateProductUseCase.execute({
      id,
      companyId: user.companyId,
      name: dto.name,
      description: dto.description,
      price: dto.price,
      stock: dto.stock,
      sku: dto.sku,
      brand: dto.brand,
      currency: dto.currency,
      minStock: dto.minStock,
      isActive: dto.isActive,
      imageUrl: dto.imageUrl,
      categoryId: dto.categoryId,
    });
  }
}
