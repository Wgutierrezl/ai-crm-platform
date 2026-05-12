export class CustomerOauthIdentity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly customerId: string,
    public readonly provider: string,
    public readonly providerUserId: string,
    public readonly email: string | null,
    public readonly emailVerified: boolean,
    public readonly displayName: string | null,
    public readonly pictureUrl: string | null,
    public readonly linkedAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

