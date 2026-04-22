export class Conversation {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly companyId: string,
    public readonly createdAt: Date,
  ) {}
}
