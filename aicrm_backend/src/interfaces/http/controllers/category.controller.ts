import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateCategoryUseCase } from '../../../application/use-cases/create-category.use-case';
import { GetCategoriesByCompanyUseCase } from '../../../application/use-cases/get-categories-by-company.use-case';
import { GetActiveCategoriesByCompanyUseCase } from '../../../application/use-cases/get-active-categories-by-company.use-case';
import { GetProductsByCategoryUseCase } from '../../../application/use-cases/get-products-by-category.use-case';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';

@ApiTags('Categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getCategoriesByCompanyUseCase: GetCategoriesByCompanyUseCase,
    private readonly getActiveCategoriesByCompanyUseCase: GetActiveCategoriesByCompanyUseCase,
    private readonly getProductsByCategoryUseCase: GetProductsByCategoryUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear categoria para la empresa autenticada' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Categoria creada correctamente' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.createCategoryUseCase.execute({
      companyId: user.companyId,
      name: dto.name,
      description: dto.description,
      slug: dto.slug,
      isActive: dto.isActive,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias por empresa' })
  @ApiResponse({ status: 200, description: 'Listado de categorias' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.getCategoriesByCompanyUseCase.execute(user.companyId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Listar categorias activas por empresa' })
  @ApiResponse({ status: 200, description: 'Listado de categorias activas' })
  async findActive(@CurrentUser() user: CurrentUserPayload) {
    return this.getActiveCategoriesByCompanyUseCase.execute(user.companyId);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Listar productos activos por categoria' })
  @ApiResponse({ status: 200, description: 'Productos por categoria' })
  async findProductsByCategory(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') categoryId: string,
  ) {
    return this.getProductsByCategoryUseCase.execute(user.companyId, categoryId);
  }
}

