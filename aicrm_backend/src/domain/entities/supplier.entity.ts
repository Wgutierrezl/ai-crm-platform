export class Supplier {
  constructor(
    public readonly id: string,
    public readonly companyId: string,
    public readonly name: string,
    public readonly documentType: string | null = null,
    public readonly documentNumber: string | null = null,
    public readonly contactName: string | null = null,
    public readonly phone: string | null = null,
    public readonly email: string | null = null,
    public readonly address: string | null = null,
    public readonly city: string | null = null,
    public readonly notes: string | null = null,
    public readonly isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}
}

