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
import { CartSessionOrmEntity } from './infrastructure/database/entities/cart-session.orm-entity';
import { CartItemOrmEntity } from './infrastructure/database/entities/cart-item.orm-entity';
import { PaymentTransactionOrmEntity } from './infrastructure/database/entities/payment-transaction.orm-entity';
import { OauthIdentityOrmEntity } from './infrastructure/database/entities/oauth-identity.orm-entity';
import { OauthRegistrationSessionOrmEntity } from './infrastructure/database/entities/oauth-registration-session.orm-entity';
import { CustomerOauthLinkSessionOrmEntity } from './infrastructure/database/entities/customer-oauth-link-session.orm-entity';
import { CustomerOauthIdentityOrmEntity } from './infrastructure/database/entities/customer-oauth-identity.orm-entity';
import { CompanyRepository } from './domain/ports/company.repository.port';
import { UserRepository } from './domain/ports/user.repository.port';
import { CustomerRepository } from './domain/ports/customer.repository.port';
import { ProductRepository } from './domain/ports/product.repository.port';
import { ConversationRepository } from './domain/ports/conversation.repository.port';
import { MessageRepository } from './domain/ports/message.repository.port';
import { OrderRepository } from './domain/ports/order.repository.port';
import { OrderItemRepository } from './domain/ports/order-item.repository.port';
import { CategoryRepository } from './domain/ports/category.repository.port';
import { ImageStoragePort } from './domain/ports/image-storage.port';
import { EmailSenderPort } from './domain/ports/email-sender.port';
import { PdfReceiptGeneratorPort } from './domain/ports/pdf-receipt-generator.port';
import { CartSessionRepository } from './domain/ports/cart-session.repository.port';
import { CartItemRepository } from './domain/ports/cart-item.repository.port';
import { CompanyWhatsappCredentialRepository } from './domain/ports/company-whatsapp-credential.repository.port';
import { CompanyWhatsappAppRepository } from './domain/ports/company-whatsapp-app.repository.port';
import { PaymentProviderPort } from './domain/ports/payment-provider.port';
import { PaymentTransactionRepository } from './domain/ports/payment-transaction.repository.port';
import { OauthIdentityRepository } from './domain/ports/oauth-identity.repository.port';
import { OauthRegistrationSessionRepository } from './domain/ports/oauth-registration-session.repository.port';
import { CustomerOauthLinkSessionRepository } from './domain/ports/customer-oauth-link-session.repository.port';
import { CustomerOauthIdentityRepository } from './domain/ports/customer-oauth-identity.repository.port';
import { GoogleOidcProviderPort } from './domain/ports/google-oidc-provider.port';
import { OauthTempStorePort } from './domain/ports/oauth-temp-store.port';
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
import { CartSessionTypeormRepository } from './infrastructure/repositories/cart-session.typeorm-repository';
import { CartItemTypeormRepository } from './infrastructure/repositories/cart-item.typeorm-repository';
import { PaymentTransactionTypeormRepository } from './infrastructure/repositories/payment-transaction.typeorm-repository';
import { OauthIdentityTypeormRepository } from './infrastructure/repositories/oauth-identity.typeorm-repository';
import { OauthRegistrationSessionTypeormRepository } from './infrastructure/repositories/oauth-registration-session.typeorm-repository';
import { CustomerOauthLinkSessionTypeormRepository } from './infrastructure/repositories/customer-oauth-link-session.typeorm-repository';
import { CustomerOauthIdentityTypeormRepository } from './infrastructure/repositories/customer-oauth-identity.typeorm-repository';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { StartGoogleLoginUseCase } from './application/use-cases/start-google-login.use-case';
import { HandleGoogleCallbackUseCase } from './application/use-cases/handle-google-callback.use-case';
import { ExchangeGoogleAuthCodeUseCase } from './application/use-cases/exchange-google-auth-code.use-case';
import { CompleteGoogleRegistrationUseCase } from './application/use-cases/complete-google-registration.use-case';
import { StartCustomerGoogleOAuthUseCase } from './application/use-cases/start-customer-google-oauth.use-case';
import { HandleCustomerGoogleOAuthCallbackUseCase } from './application/use-cases/handle-customer-google-oauth-callback.use-case';
import { CreateProductUseCase } from './application/use-cases/create-product.use-case';
import { GetProductsByCompanyUseCase } from './application/use-cases/get-products-by-company.use-case';
import { UpdateProductUseCase } from './application/use-cases/update-product.use-case';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { GetCategoriesByCompanyUseCase } from './application/use-cases/get-categories-by-company.use-case';
import { GetActiveCategoriesByCompanyUseCase } from './application/use-cases/get-active-categories-by-company.use-case';
import { GetProductsByCategoryUseCase } from './application/use-cases/get-products-by-category.use-case';
import { SearchProductsByCategoryOrTextUseCase } from './application/use-cases/search-products-by-category-or-text.use-case';
import { UpdateCategoryStatusUseCase } from './application/use-cases/update-category-status.use-case';
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
import { GetOrCreateActiveCartSessionUseCase } from './application/use-cases/get-or-create-active-cart-session.use-case';
import { AddItemToCartUseCase } from './application/use-cases/add-item-to-cart.use-case';
import { ViewCartUseCase } from './application/use-cases/view-cart.use-case';
import { UpdateCartItemQuantityUseCase } from './application/use-cases/update-cart-item-quantity.use-case';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';
import { ExpireOldCartSessionsUseCase } from './application/use-cases/expire-old-cart-sessions.use-case';
import { ConfirmCartCheckoutUseCase } from './application/use-cases/confirm-cart-checkout.use-case';
import { ToolExecutionService } from './application/services/tool-execution.service';
import { OnboardingProfileExtractorService } from './application/services/onboarding-profile-extractor.service';
import { AssistantOnboardingToolsService } from './application/services/assistant-onboarding-tools.service';
import { TransactionalEmailService } from './application/services/transactional-email.service';
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
import { CustomersOAuthController } from './interfaces/http/controllers/customers-oauth.controller';
import { JwtAuthGuard } from './interfaces/http/guards/jwt-auth.guard';
import { AiModule } from './infrastructure/ai/ai.module';
import { MetaWhatsappService } from './infrastructure/whatsapp/meta-whatsapp.service';
import { CloudinaryImageStorageService } from './infrastructure/external-services/cloudinary/cloudinary-image-storage.service';
import { MockPaymentProvider } from './infrastructure/payments/mock-payment.provider';
import { GmailSmtpEmailSender } from './infrastructure/email/gmail-smtp-email-sender';
import { PdfkitReceiptGenerator } from './infrastructure/pdf/pdfkit-receipt-generator';
import { GoogleOidcAdapter } from './infrastructure/oauth/google-oidc.adapter';
import { InMemoryOauthTempStoreAdapter } from './infrastructure/security/in-memory-oauth-temp-store.adapter';

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
          CartSessionOrmEntity,
          CartItemOrmEntity,
          PaymentTransactionOrmEntity,
          OauthIdentityOrmEntity,
          OauthRegistrationSessionOrmEntity,
          CustomerOauthLinkSessionOrmEntity,
          CustomerOauthIdentityOrmEntity,
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
      CartSessionOrmEntity,
      CartItemOrmEntity,
      PaymentTransactionOrmEntity,
      OauthIdentityOrmEntity,
      OauthRegistrationSessionOrmEntity,
      CustomerOauthLinkSessionOrmEntity,
      CustomerOauthIdentityOrmEntity,
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
    CustomersOAuthController,
  ],
  providers: [
    AppService,
    JwtAuthGuard,
    RegisterUserUseCase,
    LoginUserUseCase,
    StartGoogleLoginUseCase,
    HandleGoogleCallbackUseCase,
    ExchangeGoogleAuthCodeUseCase,
    CompleteGoogleRegistrationUseCase,
    StartCustomerGoogleOAuthUseCase,
    HandleCustomerGoogleOAuthCallbackUseCase,
    CreateProductUseCase,
    GetProductsByCompanyUseCase,
    UpdateProductUseCase,
    CreateCategoryUseCase,
    GetCategoriesByCompanyUseCase,
    GetActiveCategoriesByCompanyUseCase,
    GetProductsByCategoryUseCase,
    SearchProductsByCategoryOrTextUseCase,
    UpdateCategoryStatusUseCase,
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
    TransactionalEmailService,
    GetOrCreateActiveCartSessionUseCase,
    AddItemToCartUseCase,
    ViewCartUseCase,
    UpdateCartItemQuantityUseCase,
    RemoveCartItemUseCase,
    ClearCartUseCase,
    ExpireOldCartSessionsUseCase,
    ConfirmCartCheckoutUseCase,
    MetaWhatsappService,
    MockPaymentProvider,
    CloudinaryImageStorageService,
    GmailSmtpEmailSender,
    PdfkitReceiptGenerator,
    GoogleOidcAdapter,
    InMemoryOauthTempStoreAdapter,
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
      provide: CartSessionRepository,
      useClass: CartSessionTypeormRepository,
    },
    {
      provide: CartItemRepository,
      useClass: CartItemTypeormRepository,
    },
    {
      provide: PaymentTransactionRepository,
      useClass: PaymentTransactionTypeormRepository,
    },
    {
      provide: OauthIdentityRepository,
      useClass: OauthIdentityTypeormRepository,
    },
    {
      provide: OauthRegistrationSessionRepository,
      useClass: OauthRegistrationSessionTypeormRepository,
    },
    {
      provide: CustomerOauthLinkSessionRepository,
      useClass: CustomerOauthLinkSessionTypeormRepository,
    },
    {
      provide: CustomerOauthIdentityRepository,
      useClass: CustomerOauthIdentityTypeormRepository,
    },
    {
      provide: PaymentProviderPort,
      useExisting: MockPaymentProvider,
    },
    {
      provide: WhatsappMessageSender,
      useExisting: MetaWhatsappService,
    },
    {
      provide: ImageStoragePort,
      useExisting: CloudinaryImageStorageService,
    },
    {
      provide: EmailSenderPort,
      useExisting: GmailSmtpEmailSender,
    },
    {
      provide: GoogleOidcProviderPort,
      useExisting: GoogleOidcAdapter,
    },
    {
      provide: OauthTempStorePort,
      useExisting: InMemoryOauthTempStoreAdapter,
    },
    {
      provide: PdfReceiptGeneratorPort,
      useExisting: PdfkitReceiptGenerator,
    },
  ],
})
export class AppModule {}
