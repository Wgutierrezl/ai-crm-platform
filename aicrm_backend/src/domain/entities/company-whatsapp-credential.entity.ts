export class CompanyWhatsappCredential {
  constructor(
    public readonly id: string,
    public readonly whatsappAppId: number,
    // TODO: En produccion estos secretos deben almacenarse cifrados.
    public readonly accessToken: string,
    public readonly verifyToken: string,
    // TODO: En produccion este secreto debe almacenarse cifrado.
    public readonly appSecret: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
