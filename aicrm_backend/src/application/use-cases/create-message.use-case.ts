import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { MessageRepository } from '../../domain/ports/message.repository.port';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { ProductRepository } from '../../domain/ports/product.repository.port';
import { OrderRepository } from '../../domain/ports/order.repository.port';
import { OrderItemRepository } from '../../domain/ports/order-item.repository.port';
import { AIService } from '../../domain/ports/ai.service.port';
import { Message, MessageRole } from '../../domain/entities/message.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { Order } from '../../domain/entities/order.entity';
import { OrderItem } from '../../domain/entities/order-item.entity';

export interface CreateMessageInput {
  conversationId: string;
  companyId: string;
  content: string;
  role: MessageRole;
}

export interface ProcessIncomingMessageInput {
  conversationId: string;
  companyId: string;
  customerMessage: string;
}

export interface ProcessIncomingMessageOutput {
  customerMessage: Message;
  botMessage: Message;
  actionExecuted?: string;
}

@Injectable()
export class CreateMessageUseCase {
  constructor(private readonly messageRepository: MessageRepository) {}

  async execute(input: CreateMessageInput): Promise<Message> {
    const message = new Message(
      uuidv4(),
      input.conversationId,
      input.companyId,
      input.content,
      input.role,
      new Date(),
    );
    return this.messageRepository.create(message);
  }
}

/**
 * Caso de uso para procesar mensajes entrantes con IA conversacional.
 *
 * Flujo completo:
 * 1. Recibe el mensaje del cliente para una conversacion.
 * 2. Guarda el mensaje del cliente en base de datos.
 * 3. Obtiene historial de mensajes de la conversacion.
 * 4. Invoca AIService.processMessage con el contexto completo.
 * 5. La IA analiza intencion y puede devolver una action.
 * 6. Si la action es CREATE_ORDER, crea Order y OrderItem.
 * 7. Si la action es GET_PRODUCTS o CREATE_CUSTOMER, ejecuta la tool correspondiente.
 * 8. Construye y guarda el mensaje final del bot.
 * 9. Devuelve mensajes y accion ejecutada.
 *
 * Ejemplo CREATE_ORDER:
 * - La IA responde con action.type = "CREATE_ORDER" y payload.items.
 * - El backend calcula total, crea Order, crea OrderItem y confirma al cliente.
 */
@Injectable()
export class ProcessIncomingMessageUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
    private readonly orderItemRepository: OrderItemRepository,
    private readonly aiService: AIService,
  ) {}

  async execute(
    input: ProcessIncomingMessageInput,
  ): Promise<ProcessIncomingMessageOutput> {
    // Paso 1: Persistir mensaje del cliente
    const customerMsg = new Message(
      uuidv4(),
      input.conversationId,
      input.companyId,
      input.customerMessage,
      'customer',
      new Date(),
    );
    const savedCustomerMsg = await this.messageRepository.create(customerMsg);

    // Paso 2: Cargar historial para contexto de IA
    const history = await this.messageRepository.findByConversationId(
      input.conversationId,
    );
    const historyForAI = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Paso 3: Llamar servicio de IA
    const aiResponse = await this.aiService.processMessage({
      conversationId: input.conversationId,
      companyId: input.companyId,
      customerMessage: input.customerMessage,
      history: historyForAI,
    });

    let botReply = aiResponse.reply;
    let actionExecuted: string | undefined;

    // Paso 4: Ejecutar tool si existe action
    if (aiResponse.action) {
      const { type, payload } = aiResponse.action;

      if (type === 'GET_PRODUCTS') {
        // Obtener productos reales y anexarlos a la respuesta
        const products = await this.productRepository.findAllByCompanyId(
          input.companyId,
        );
        const productList = products
          .map((p) => `- ${p.name}: $${p.price} (stock: ${p.stock})`)
          .join('\n');
        botReply = `${botReply}\n\nProductos disponibles:\n${productList}`;
        actionExecuted = 'GET_PRODUCTS';
      }

      if (type === 'CREATE_CUSTOMER' && payload) {
        const newCustomer = new Customer(
          uuidv4(),
          payload.name,
          payload.phone,
          payload.email,
          input.companyId,
          payload.identificationType,
          payload.identificationNumber,
        );
        await this.customerRepository.create(newCustomer);
        actionExecuted = 'CREATE_CUSTOMER';
      }

      if (type === 'CREATE_ORDER' && payload) {
        // Calcular total con los items del pedido
        const items: Array<{
          productId: string;
          quantity: number;
          price: number;
        }> = payload.items ?? [];
        const total = items.reduce(
          (sum: number, i: { price: number; quantity: number }) =>
            sum + i.price * i.quantity,
          0,
        );

        const order = new Order(
          uuidv4(),
          payload.customerId,
          input.companyId,
          'pending',
          total,
          new Date(),
        );
        const savedOrder = await this.orderRepository.create(order);

        for (const item of items) {
          const orderItem = new OrderItem(
            uuidv4(),
            savedOrder.id,
            item.productId,
            input.companyId,
            item.quantity,
            item.price,
          );
          await this.orderItemRepository.create(orderItem);
        }

        botReply = `${botReply}\n\n✅ Pedido creado exitosamente. ID: ${savedOrder.id}. Total: $${total}`;
        actionExecuted = 'CREATE_ORDER';
      }
    }

    // Paso 5: Persistir respuesta final del bot
    const botMsg = new Message(
      uuidv4(),
      input.conversationId,
      input.companyId,
      botReply,
      'bot',
      new Date(),
    );
    const savedBotMsg = await this.messageRepository.create(botMsg);

    return {
      customerMessage: savedCustomerMsg,
      botMessage: savedBotMsg,
      actionExecuted,
    };
  }
}
