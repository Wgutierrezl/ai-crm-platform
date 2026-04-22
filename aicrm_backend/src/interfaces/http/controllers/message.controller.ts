import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateMessageUseCase,
  ProcessIncomingMessageUseCase,
} from '../../../application/use-cases/create-message.use-case';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth('JWT-auth')
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(
    private readonly createMessageUseCase: CreateMessageUseCase,
    private readonly processIncomingMessageUseCase: ProcessIncomingMessageUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear mensaje manual de agente' })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({ status: 201, description: 'Mensaje creado correctamente' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async createManual(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateMessageDto,
  ) {
    return this.createMessageUseCase.execute({
      conversationId: dto.conversationId,
      companyId: user.companyId,
      content: dto.content,
      role: 'agent',
    });
  }

  @Post('incoming')
  @ApiOperation({
    summary:
      'Procesar mensaje entrante del cliente con IA y tools (GET_PRODUCTS, CREATE_CUSTOMER, CREATE_ORDER)',
  })
  @ApiBody({ type: CreateMessageDto })
  @ApiResponse({
    status: 201,
    description: 'Mensaje procesado y respuesta del bot generada',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async incoming(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateMessageDto,
  ) {
    return this.processIncomingMessageUseCase.execute({
      conversationId: dto.conversationId,
      companyId: user.companyId,
      customerMessage: dto.content,
    });
  }
}
