import { OauthRegistrationSession } from '../entities/oauth-registration-session.entity';

export abstract class OauthRegistrationSessionRepository {
  abstract create(session: OauthRegistrationSession): Promise<OauthRegistrationSession>;
  abstract findById(id: string): Promise<OauthRegistrationSession | null>;
  abstract update(session: OauthRegistrationSession): Promise<OauthRegistrationSession>;
}

