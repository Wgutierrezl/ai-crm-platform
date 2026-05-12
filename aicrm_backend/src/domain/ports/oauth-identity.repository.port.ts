import { OauthIdentity } from '../entities/oauth-identity.entity';

export abstract class OauthIdentityRepository {
  abstract create(identity: OauthIdentity): Promise<OauthIdentity>;
  abstract findByProviderUserId(
    provider: string,
    providerUserId: string,
  ): Promise<OauthIdentity | null>;
  abstract findByProviderAndUserId(
    provider: string,
    userId: string,
  ): Promise<OauthIdentity | null>;
}
