import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateSupplierUseCase } from '../../../application/use-cases/create-supplier.use-case';
import { GetSupplierByIdUseCase } from '../../../application/use-cases/get-supplier-by-id.use-case';
import { GetSuppliersByCompanyUseCase } from '../../../application/use-cases/get-suppliers-by-company.use-case';
import { UpdateSupplierStatusUseCase } from '../../../application/use-cases/update-supplier-status.use-case';
import { UpdateSupplierUseCase } from '../../../application/use-cases/update-supplier.use-case';
import { CreateSupplierDto } from '../dtos/create-supplier.dto';
import { UpdateSupplierStatusDto } from '../dtos/update-supplier-status.dto';
import { UpdateSupplierDto } from '../dtos/update-supplier.dto';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Suppliers')
@ApiBearerAuth('JWT-auth')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SupplierController {
  constructor(
    private readonly createSupplierUseCase: CreateSupplierUseCase,
    private readonly getSuppliersByCompanyUseCase: GetSuppliersByCompanyUseCase,
    private readonly getSupplierByIdUseCase: GetSupplierByIdUseCase,
    private readonly updateSupplierUseCase: UpdateSupplierUseCase,
    private readonly updateSupplierStatusUseCase: UpdateSupplierStatusUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar proveedores por empresa' })
  @ApiResponse({ status: 200, description: 'Listado de proveedores' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.getSuppliersByCompanyUseCase.execute(user.companyId);
  }

  @Post()
  @ApiOperation({ summary: 'Crear proveedor para la empresa autenticada' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({ status: 201, description: 'Proveedor creado correctamente' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.createSupplierUseCase.execute({
      companyId: user.companyId,
      name: dto.name,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      contactName: dto.contactName,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      notes: dto.notes,
      isActive: dto.isActive,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar proveedor por ID de la empresa autenticada' })
  @ApiResponse({ status: 200, description: 'Proveedor encontrado' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.getSupplierByIdUseCase.execute(id, user.companyId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar proveedor de la empresa autenticada' })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiResponse({ status: 200, description: 'Proveedor actualizado correctamente' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.updateSupplierUseCase.execute({
      id,
      companyId: user.companyId,
      name: dto.name,
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      contactName: dto.contactName,
      phone: dto.phone,
      email: dto.email,
      address: dto.address,
      city: dto.city,
      notes: dto.notes,
      isActive: dto.isActive,
    });
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activar o desactivar proveedor de la empresa autenticada' })
  @ApiBody({ type: UpdateSupplierStatusDto })
  @ApiResponse({ status: 200, description: 'Estado del proveedor actualizado' })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierStatusDto,
  ) {
    return this.updateSupplierStatusUseCase.execute({
      id,
      companyId: user.companyId,
      isActive: dto.isActive,
    });
  }
}

