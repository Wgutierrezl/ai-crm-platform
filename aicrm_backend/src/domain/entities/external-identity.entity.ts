export type ExternalChannel = 'whatsapp';

export class ExternalIdentity {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly channel: ExternalChannel,
    public readonly externalUserId: string,
    public readonly phone: string | null,
    public readonly customerId: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
