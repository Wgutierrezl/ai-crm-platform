import { Injectable } from '@nestjs/common';
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
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('Ya existe un usuario con ese email');
    }

    const companyId = uuidv4();
    const company = new Company(companyId, input.companyName, new Date());
    await this.companyRepository.create(company);

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

    return { userId, companyId, email: user.email };
  }
}
