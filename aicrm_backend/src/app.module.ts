import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyOrmEntity } from './infrastructure/database/entities/company.orm-entity';
import { UserOrmEntity } from './infrastructure/database/entities/user.orm-entity';
import { CustomerOrmEntity } from './infrastructure/database/entities/customer.orm-entity';
import { ProductOrmEntity } from './infrastructure/database/entities/product.orm-entity';
import { ConversationOrmEntity } from './infrastructure/database/entities/conversation.orm-entity';
import { MessageOrmEntity } from './infrastructure/database/entities/message.orm-entity';
import { OrderOrmEntity } from './infrastructure/database/entities/order.orm-entity';
import { OrderItemOrmEntity } from './infrastructure/database/entities/order-item.orm-entity';
import { CompanyRepository } from './domain/ports/company.repository.port';
import { UserRepository } from './domain/ports/user.repository.port';
import { CustomerRepository } from './domain/ports/customer.repository.port';
import { ProductRepository } from './domain/ports/product.repository.port';
import { ConversationRepository } from './domain/ports/conversation.repository.port';
import { MessageRepository } from './domain/ports/message.repository.port';
import { OrderRepository } from './domain/ports/order.repository.port';
import { OrderItemRepository } from './domain/ports/order-item.repository.port';
import { CompanyTypeormRepository } from './infrastructure/repositories/company.typeorm-repository';
import { UserTypeormRepository } from './infrastructure/repositories/user.typeorm-repository';
import { CustomerTypeormRepository } from './infrastructure/repositories/customer.typeorm-repository';
import { ProductTypeormRepository } from './infrastructure/repositories/product.typeorm-repository';
import { ConversationTypeormRepository } from './infrastructure/repositories/conversation.typeorm-repository';
import { MessageTypeormRepository } from './infrastructure/repositories/message.typeorm-repository';
import { OrderTypeormRepository } from './infrastructure/repositories/order.typeorm-repository';
import { OrderItemTypeormRepository } from './infrastructure/repositories/order-item.typeorm-repository';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { GetProductsByCompanyUseCase } from './application/use-cases/get-products-by-company.use-case';
import { CreateConversationUseCase } from './application/use-cases/create-conversation.use-case';
import { GetConversationsUseCase } from './application/use-cases/get-conversations.use-case';
import { CreateMessageUseCase, ProcessIncomingMessageUseCase } from './application/use-cases/create-message.use-case';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { GetOrdersByCompanyUseCase } from './application/use-cases/get-orders-by-company.use-case';
import { AuthController } from './interfaces/http/controllers/auth.controller';
import { ProductController } from './interfaces/http/controllers/product.controller';
import { ConversationController } from './interfaces/http/controllers/conversation.controller';
import { MessageController } from './interfaces/http/controllers/message.controller';
import { OrderController } from './interfaces/http/controllers/order.controller';
import { JwtAuthGuard } from './interfaces/http/guards/jwt-auth.guard';
import { AiModule } from './infrastructure/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<string>('DB_PORT', '3306')),
        username: configService.get<string>('DB_USERNAME', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'ai_crm'),
        entities: [
          CompanyOrmEntity,
          UserOrmEntity,
          CustomerOrmEntity,
          ProductOrmEntity,
          ConversationOrmEntity,
          MessageOrmEntity,
          OrderOrmEntity,
          OrderItemOrmEntity,
        ],
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([
      CompanyOrmEntity,
      UserOrmEntity,
      CustomerOrmEntity,
      ProductOrmEntity,
      ConversationOrmEntity,
      MessageOrmEntity,
      OrderOrmEntity,
      OrderItemOrmEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'supersecretkey'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d') as any,
        },
      }),
      global: true,
    }),
    AiModule,
  ],
  controllers: [
    AppController,
    AuthController,
    ProductController,
    ConversationController,
    MessageController,
    OrderController,
  ],
  providers: [
    AppService,
    JwtAuthGuard,
    RegisterUserUseCase,
    LoginUserUseCase,
    CreateProductUseCase,
    GetProductsByCompanyUseCase,
    CreateConversationUseCase,
    GetConversationsUseCase,
    CreateMessageUseCase,
    ProcessIncomingMessageUseCase,
    CreateOrderUseCase,
    GetOrdersByCompanyUseCase,
    {
      provide: CompanyRepository,
      useClass: CompanyTypeormRepository,
    },
    {
      provide: UserRepository,
      useClass: UserTypeormRepository,
    },
    {
      provide: CustomerRepository,
      useClass: CustomerTypeormRepository,
    },
    {
      provide: ProductRepository,
      useClass: ProductTypeormRepository,
    },
    {
      provide: ConversationRepository,
      useClass: ConversationTypeormRepository,
    },
    {
      provide: MessageRepository,
      useClass: MessageTypeormRepository,
    },
    {
      provide: OrderRepository,
      useClass: OrderTypeormRepository,
    },
    {
      provide: OrderItemRepository,
      useClass: OrderItemTypeormRepository,
    },
  ],
})
export class AppModule {}
