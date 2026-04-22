export type UserRole = 'admin' | 'agent';
export type IdentificationType = 'CC' | 'CE' | 'NIT' | 'PASSPORT' | string;

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly identificationType: IdentificationType,
    public readonly identificationNumber: string,
    public readonly role: UserRole,
    public readonly companyId: string,
    public readonly createdAt: Date,
    public readonly fullName?: string,
  ) {}
}
