import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { CompanyOrmEntity } from './entities/company.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { CustomerOrmEntity } from './entities/customer.orm-entity';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { ConversationOrmEntity } from './entities/conversation.orm-entity';
import { MessageOrmEntity } from './entities/message.orm-entity';
import { OrderOrmEntity } from './entities/order.orm-entity';
import { OrderItemOrmEntity } from './entities/order-item.orm-entity';
import { CompanyWhatsappCredentialOrmEntity } from './entities/company-whatsapp-credential.orm-entity';
import { CompanyWhatsappAppOrmEntity } from './entities/company-whatsapp-app.orm-entity';
import { ExternalIdentityOrmEntity } from './entities/external-identity.orm-entity';
import { ConversationStateOrmEntity } from './entities/conversation-state.orm-entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_crm',
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
  ],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
});
