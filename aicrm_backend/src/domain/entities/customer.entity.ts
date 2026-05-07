export class Customer {
  constructor(
    public readonly id: string,
    public readonly name: string | null,
    public readonly phone: string | null,
    public readonly email: string | null,
    public readonly companyId: string,
    public readonly identificationType: string | null = null,
    public readonly identificationNumber: string | null = null,
    public readonly firstName: string | null = null,
    public readonly lastName: string | null = null,
    public readonly fullName: string | null = null,
    public readonly address: string | null = null,
    public readonly city: string | null = null,
    public readonly age: number | null = null,
    public readonly metadata: Record<string, unknown> | null = null,
    public readonly onboardingCompleted: boolean = false,
    public readonly onboardingStep: string | null = null,
    public readonly profileCompletionPercentage: number = 0,
  ) {}
}
