import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import type { SignOptions } from 'jsonwebtoken';
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
import { CompanyWhatsappCredentialOrmEntity } from './infrastructure/database/entities/company-whatsapp-credential.orm-entity';
import { CompanyWhatsappAppOrmEntity } from './infrastructure/database/entities/company-whatsapp-app.orm-entity';
import { ExternalIdentityOrmEntity } from './infrastructure/database/entities/external-identity.orm-entity';
import { ConversationStateOrmEntity } from './infrastructure/database/entities/conversation-state.orm-entity';
import { CategoryOrmEntity } from './infrastructure/database/entities/category.orm-entity';
import { CompanyRepository } from './domain/ports/company.repository.port';
import { UserRepository } from './domain/ports/user.repository.port';
import { CustomerRepository } from './domain/ports/customer.repository.port';
import { ProductRepository } from './domain/ports/product.repository.port';
import { ConversationRepository } from './domain/ports/conversation.repository.port';
import { MessageRepository } from './domain/ports/message.repository.port';
import { OrderRepository } from './domain/ports/order.repository.port';
import { OrderItemRepository } from './domain/ports/order-item.repository.port';
import { CategoryRepository } from './domain/ports/category.repository.port';
import { CompanyWhatsappCredentialRepository } from './domain/ports/company-whatsapp-credential.repository.port';
import { CompanyWhatsappAppRepository } from './domain/ports/company-whatsapp-app.repository.port';
import { WhatsappMessageSender } from './domain/ports/whatsapp-message-sender.port';
import { ExternalIdentityRepository } from './domain/ports/external-identity.repository.port';
import { ConversationStateRepository } from './domain/ports/conversation-state.repository.port';
import { CompanyTypeormRepository } from './infrastructure/repositories/company.typeorm-repository';
import { UserTypeormRepository } from './infrastructure/repositories/user.typeorm-repository';
import { CustomerTypeormRepository } from './infrastructure/repositories/customer.typeorm-repository';
import { ProductTypeormRepository } from './infrastructure/repositories/product.typeorm-repository';
import { ConversationTypeormRepository } from './infrastructure/repositories/conversation.typeorm-repository';
import { MessageTypeormRepository } from './infrastructure/repositories/message.typeorm-repository';
import { OrderTypeormRepository } from './infrastructure/repositories/order.typeorm-repository';
import { OrderItemTypeormRepository } from './infrastructure/repositories/order-item.typeorm-repository';
import { CategoryTypeormRepository } from './infrastructure/repositories/category.typeorm-repository';
import { CompanyWhatsappCredentialTypeormRepository } from './infrastructure/repositories/company-whatsapp-credential.typeorm-repository';
import { CompanyWhatsappAppTypeormRepository } from './infrastructure/repositories/company-whatsapp-app.typeorm-repository';
import { ExternalIdentityTypeormRepository } from './infrastructure/repositories/external-identity.typeorm-repository';
import { ConversationStateTypeormRepository } from './infrastructure/repositories/conversation-state.typeorm-repository';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { GetProductsByCompanyUseCase } from './application/use-cases/get-products-by-company.use-case';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { GetCategoriesByCompanyUseCase } from './application/use-cases/get-categories-by-company.use-case';
import { GetActiveCategoriesByCompanyUseCase } from './application/use-cases/get-active-categories-by-company.use-case';
import { GetProductsByCategoryUseCase } from './application/use-cases/get-products-by-category.use-case';
import { SearchProductsByCategoryOrTextUseCase } from './application/use-cases/search-products-by-category-or-text.use-case';
import { CreateConversationUseCase } from './application/use-cases/create-conversation.use-case';
import { GetConversationsUseCase } from './application/use-cases/get-conversations.use-case';
import {
  CreateMessageUseCase,
  ProcessIncomingMessageUseCase,
} from './application/use-cases/create-message.use-case';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { GetOrdersByCompanyUseCase } from './application/use-cases/get-orders-by-company.use-case';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { GetCustomersByCompanyUseCase } from './application/use-cases/get-customers-by-company.use-case';
import { GetCustomerByIdUseCase } from './application/use-cases/get-customer-by-id.use-case';
import { GetCustomerByPhoneUseCase } from './application/use-cases/get-customer-by-phone.use-case';
import { UpsertCompanyWhatsappCredentialUseCase } from './application/use-cases/upsert-company-whatsapp-credential.use-case';
import { UpsertCompanyWhatsappAppUseCase } from './application/use-cases/upsert-company-whatsapp-app.use-case';
import { VerifyWhatsappWebhookUseCase } from './application/use-cases/verify-whatsapp-webhook.use-case';
import { HandleWhatsappWebhookUseCase } from './application/use-cases/handle-whatsapp-webhook.use-case';
import { HandleInboundChannelMessageUseCase } from './application/use-cases/handle-inbound-channel-message.use-case';
import { ToolExecutionService } from './application/services/tool-execution.service';
import { OnboardingProfileExtractorService } from './application/services/onboarding-profile-extractor.service';
import { AssistantOnboardingToolsService } from './application/services/assistant-onboarding-tools.service';
import { AuthController } from './interfaces/http/controllers/auth.controller';
import { ProductController } from './interfaces/http/controllers/product.controller';
import { CategoryController } from './interfaces/http/controllers/category.controller';
import { ConversationController } from './interfaces/http/controllers/conversation.controller';
import { MessageController } from './interfaces/http/controllers/message.controller';
import { OrderController } from './interfaces/http/controllers/order.controller';
import { CustomerController } from './interfaces/http/controllers/customer.controller';
import { CompanyWhatsappCredentialController } from './interfaces/http/controllers/company-whatsapp-credential.controller';
import { CompanyWhatsappAppController } from './interfaces/http/controllers/company-whatsapp-app.controller';
import { WhatsappWebhookController } from './interfaces/http/controllers/whatsapp-webhook.controller';
import { JwtAuthGuard } from './interfaces/http/guards/jwt-auth.guard';
import { AiModule } from './infrastructure/ai/ai.module';
import { MetaWhatsappService } from './infrastructure/whatsapp/meta-whatsapp.service';

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
          CompanyWhatsappAppOrmEntity,
          CompanyWhatsappCredentialOrmEntity,
          ExternalIdentityOrmEntity,
          ConversationStateOrmEntity,
          CategoryOrmEntity,
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
      CompanyWhatsappAppOrmEntity,
      CompanyWhatsappCredentialOrmEntity,
      ExternalIdentityOrmEntity,
      ConversationStateOrmEntity,
      CategoryOrmEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') ??
          '1d') as SignOptions['expiresIn'];

        return {
          secret: configService.get<string>('JWT_SECRET', 'supersecretkey'),
          signOptions: {
            expiresIn,
          },
        };
      },
      global: true,
    }),
    AiModule,
  ],
  controllers: [
    AppController,
    AuthController,
    ProductController,
    CategoryController,
    CustomerController,
    ConversationController,
    MessageController,
    OrderController,
    CompanyWhatsappAppController,
    CompanyWhatsappCredentialController,
    WhatsappWebhookController,
  ],
  providers: [
    AppService,
    JwtAuthGuard,
    RegisterUserUseCase,
    LoginUserUseCase,
    CreateProductUseCase,
    GetProductsByCompanyUseCase,
    CreateCategoryUseCase,
    GetCategoriesByCompanyUseCase,
    GetActiveCategoriesByCompanyUseCase,
    GetProductsByCategoryUseCase,
    SearchProductsByCategoryOrTextUseCase,
    CreateCustomerUseCase,
    GetCustomersByCompanyUseCase,
    GetCustomerByIdUseCase,
    GetCustomerByPhoneUseCase,
    UpsertCompanyWhatsappAppUseCase,
    UpsertCompanyWhatsappCredentialUseCase,
    VerifyWhatsappWebhookUseCase,
    HandleWhatsappWebhookUseCase,
    HandleInboundChannelMessageUseCase,
    ToolExecutionService,
    OnboardingProfileExtractorService,
    AssistantOnboardingToolsService,
    MetaWhatsappService,
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
    {
      provide: CategoryRepository,
      useClass: CategoryTypeormRepository,
    },
    {
      provide: CompanyWhatsappAppRepository,
      useClass: CompanyWhatsappAppTypeormRepository,
    },
    {
      provide: CompanyWhatsappCredentialRepository,
      useClass: CompanyWhatsappCredentialTypeormRepository,
    },
    {
      provide: ExternalIdentityRepository,
      useClass: ExternalIdentityTypeormRepository,
    },
    {
      provide: ConversationStateRepository,
      useClass: ConversationStateTypeormRepository,
    },
    {
      provide: WhatsappMessageSender,
      useExisting: MetaWhatsappService,
    },
  ],
})
export class AppModule {}
