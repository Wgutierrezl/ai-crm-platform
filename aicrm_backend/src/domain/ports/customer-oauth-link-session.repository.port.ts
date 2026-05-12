import { CustomerOauthLinkSession } from '../entities/customer-oauth-link-session.entity';

export abstract class CustomerOauthLinkSessionRepository {
  abstract create(
    session: CustomerOauthLinkSession,
  ): Promise<CustomerOauthLinkSession>;
  abstract findByStateToken(stateToken: string): Promise<CustomerOauthLinkSession | null>;
  abstract update(
    session: CustomerOauthLinkSession,
  ): Promise<CustomerOauthLinkSession>;
}

