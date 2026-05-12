export type OauthRegistrationSessionStatus = 'pending' | 'consumed';

export class OauthRegistrationSession {
  constructor(
    public readonly id: string,
    public readonly provider: string,
    public readonly providerUserId: string,
    public readonly email: string,
    public readonly emailVerified: boolean,
    public readonly fullName: string | null,
    public readonly pictureUrl: string | null,
    public readonly status: OauthRegistrationSessionStatus,
    public readonly expiresAt: Date,
    public readonly consumedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

