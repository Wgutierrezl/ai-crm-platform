export class Customer {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly phone: string,
    public readonly email: string,
    public readonly companyId: string,
    public readonly identificationType?: string,
    public readonly identificationNumber?: string,
  ) {}
}
