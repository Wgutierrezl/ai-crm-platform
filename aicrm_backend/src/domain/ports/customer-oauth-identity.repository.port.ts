import { CustomerOauthIdentity } from '../entities/customer-oauth-identity.entity';

export abstract class CustomerOauthIdentityRepository {
  abstract create(
    identity: CustomerOauthIdentity,
  ): Promise<CustomerOauthIdentity>;
  abstract update(
    identity: CustomerOauthIdentity,
  ): Promise<CustomerOauthIdentity>;
  abstract findByCompanyProviderUserId(
    companyId: string,
    provider: string,
    providerUserId: string,
  ): Promise<CustomerOauthIdentity | null>;
  abstract findByCompanyProviderCustomerId(
    companyId: string,
    provider: string,
    customerId: string,
  ): Promise<CustomerOauthIdentity | null>;
}

