import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProductUseCase } from '../../../application/use-cases/create-product.use-case';
import { GetProductsByCompanyUseCase } from '../../../application/use-cases/get-products-by-company.use-case';
import { UpdateProductUseCase } from '../../../application/use-cases/update-product.use-case';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';
import { ImageStoragePort } from '../../../domain/ports/image-storage.port';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductsByCompanyUseCase: GetProductsByCompanyUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly imageStorage: ImageStoragePort,
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
      supplierId: this.parseNullableIdentifier(dto.supplierId),
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

  @Post('with-image')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductDto })
  @ApiOperation({ summary: 'Crear producto con imagen opcional (multipart/form-data)' })
  @ApiResponse({ status: 201, description: 'Producto creado correctamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async createWithImage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateProductDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /image\/(jpeg|jpg|png|webp|gif|avif)/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ fileIsRequired: false }),
    )
    image?: Express.Multer.File,
  ) {
    const imageUrl = image ? await this.uploadProductImage(user.companyId, image) : dto.imageUrl;
    return this.createProductUseCase.execute({
      ...this.normalizeCreateDto(dto),
      imageUrl,
      companyId: user.companyId,
    });
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
      supplierId: dto.supplierId,
    });
  }

  @Patch(':id/with-image')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProductDto })
  @ApiOperation({
    summary: 'Actualizar producto con imagen opcional (multipart/form-data)',
  })
  @ApiResponse({ status: 200, description: 'Producto actualizado correctamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  async updateWithImage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /image\/(jpeg|jpg|png|webp|gif|avif)/ })
        .addMaxSizeValidator({ maxSize: 5 * 1024 * 1024 })
        .build({ fileIsRequired: false }),
    )
    image?: Express.Multer.File,
  ) {
    const normalized = this.normalizeUpdateDto(dto);
    const imageUrl = image
      ? await this.uploadProductImage(user.companyId, image)
      : normalized.imageUrl;

    return this.updateProductUseCase.execute({
      id,
      companyId: user.companyId,
      ...normalized,
      imageUrl,
    });
  }

  private async uploadProductImage(
    companyId: string,
    image: Express.Multer.File,
  ): Promise<string> {
    const uploaded = await this.imageStorage.uploadImage({
      fileBuffer: image.buffer,
      fileName: image.originalname,
      mimeType: image.mimetype,
      folder: `${companyId}/products`,
    });
    return uploaded.secureUrl;
  }

  private normalizeCreateDto(dto: CreateProductDto): CreateProductDto {
    return {
      ...dto,
      price: Number(dto.price),
      stock: Number(dto.stock),
      minStock:
        dto.minStock !== undefined ? Number(dto.minStock) : dto.minStock,
      isActive: this.parseOptionalBoolean(dto.isActive),
      supplierId: this.parseNullableIdentifier(dto.supplierId),
    };
  }

  private normalizeUpdateDto(dto: UpdateProductDto): UpdateProductDto {
    return {
      ...dto,
      price: dto.price !== undefined ? Number(dto.price) : dto.price,
      stock: dto.stock !== undefined ? Number(dto.stock) : dto.stock,
      minStock:
        dto.minStock !== undefined ? Number(dto.minStock) : dto.minStock,
      isActive: this.parseOptionalBoolean(dto.isActive),
      supplierId: this.parseNullableIdentifier(dto.supplierId),
    };
  }

  private parseOptionalBoolean(value: unknown): boolean | undefined {
    if (value === undefined || value === null || typeof value === 'boolean') {
      return value as boolean | undefined;
    }
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return undefined;
  }

  private parseNullableIdentifier(value: unknown): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const normalized = String(value).trim();
    if (!normalized || normalized.toLowerCase() === 'null') return null;
    return normalized;
  }
}
