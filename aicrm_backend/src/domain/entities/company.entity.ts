export class Company {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly createdAt: Date,
    public readonly assistantName: string | null = null,
    public readonly assistantContext: string | null = null,
    public readonly assistantWelcomeMessage: string | null = null,
  ) {}
}
