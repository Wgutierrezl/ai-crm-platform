import { ExternalIdentity } from '../entities/external-identity.entity';

export abstract class ExternalIdentityRepository {
  abstract create(identity: ExternalIdentity): Promise<ExternalIdentity>;
  abstract update(identity: ExternalIdentity): Promise<ExternalIdentity>;
  abstract findByChannelAndExternalUserId(
    companyId: string,
    channel: string,
    externalUserId: string,
  ): Promise<ExternalIdentity | null>;
}
