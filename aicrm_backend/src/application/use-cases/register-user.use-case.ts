import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../../domain/ports/user.repository.port';
import { CompanyRepository } from '../../domain/ports/company.repository.port';
import { User } from '../../domain/entities/user.entity';
import { Company } from '../../domain/entities/company.entity';

export interface RegisterUserInput {
  companyName: string;
  email: string;
  password: string;
  identificationType: string;
  identificationNumber: string;
  fullName?: string;
}

export interface RegisterUserOutput {
  userId: string;
  companyId: string;
  email: string;
}

/**
 * Caso de uso para registrar una nueva empresa y su usuario administrador.
 */
@Injectable()
export class RegisterUserUseCase {
  private readonly logger = new Logger(RegisterUserUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    this.logger.log(`Iniciando registro para email=${input.email}`);

    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      this.logger.warn(`Registro rechazado: email ya existe (${input.email})`);
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const companyId = uuidv4();
    const company = new Company(companyId, input.companyName, new Date());
    await this.companyRepository.create(company);
    this.logger.log(`Empresa creada companyId=${companyId}`);

    const passwordHash = await bcrypt.hash(input.password, 10);
    const userId = uuidv4();
    const user = new User(
      userId,
      input.email,
      passwordHash,
      input.identificationType,
      input.identificationNumber,
      'admin',
      companyId,
      new Date(),
      input.fullName,
    );

    await this.userRepository.create(user);
    this.logger.log(
      `Usuario admin creado userId=${userId}, companyId=${companyId}`,
    );

    return { userId, companyId, email: user.email };
  }
}
