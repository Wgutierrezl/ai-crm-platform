import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateConversationUseCase } from '../../../application/use-cases/create-conversation.use-case';
import { GetConversationsUseCase } from '../../../application/use-cases/get-conversations.use-case';
import { GetConversationMessagesUseCase } from '../../../application/use-cases/get-conversation-messages.use-case';
import { CreateConversationDto } from '../dtos/create-conversation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../guards/current-user.decorator';
import type { CurrentUserPayload } from '../guards/current-user.decorator';

@ApiTags('Conversations')
@ApiBearerAuth('JWT-auth')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationController {
  constructor(
    private readonly createConversationUseCase: CreateConversationUseCase,
    private readonly getConversationsUseCase: GetConversationsUseCase,
    private readonly getConversationMessagesUseCase: GetConversationMessagesUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear conversacion para un cliente de la empresa' })
  @ApiBody({ type: CreateConversationDto })
  @ApiResponse({
    status: 201,
    description: 'Conversacion creada correctamente',
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.createConversationUseCase.execute({
      customerId: dto.customerId,
      companyId: user.companyId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Listar conversaciones por empresa' })
  @ApiResponse({ status: 200, description: 'Listado de conversaciones' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async list(@CurrentUser() user: CurrentUserPayload) {
    return this.getConversationsUseCase.execute(user.companyId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Listar mensajes por conversacion del tenant' })
  @ApiResponse({ status: 200, description: 'Listado de mensajes' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 404, description: 'Conversacion no encontrada' })
  async listMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') conversationId: string,
  ) {
    return this.getConversationMessagesUseCase.execute(
      conversationId,
      user.companyId,
    );
  }
}
