import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from '../../domain/entities/payment-transaction.entity';
import { PaymentTransactionRepository } from '../../domain/ports/payment-transaction.repository.port';
import { PaymentTransactionOrmEntity } from '../database/entities/payment-transaction.orm-entity';

@Injectable()
export class PaymentTransactionTypeormRepository extends PaymentTransactionRepository {
  constructor(
    @InjectRepository(PaymentTransactionOrmEntity)
    private readonly ormRepo: Repository<PaymentTransactionOrmEntity>,
  ) {
    super();
  }

  private toDomain(entity: PaymentTransactionOrmEntity): PaymentTransaction {
    return new PaymentTransaction(
      entity.id,
      entity.companyId,
      entity.customerId,
      entity.cartSessionId,
      entity.orderId,
      entity.idempotencyKey,
      entity.provider,
      entity.status as PaymentTransaction['status'],
      Number(entity.amount),
      entity.currency,
      entity.mockReference,
      entity.methodType,
      entity.last4,
      entity.brand,
      entity.metadataJson,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  async create(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    const saved = await this.ormRepo.save(
      this.ormRepo.create({
        id: transaction.id,
        companyId: transaction.companyId,
        customerId: transaction.customerId,
        cartSessionId: transaction.cartSessionId,
        orderId: transaction.orderId,
        idempotencyKey: transaction.idempotencyKey,
        provider: transaction.provider,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        mockReference: transaction.mockReference,
        methodType: transaction.methodType,
        last4: transaction.last4,
        brand: transaction.brand,
        metadataJson: transaction.metadataJson,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      }),
    );
    return this.toDomain(saved);
  }

  async update(transaction: PaymentTransaction): Promise<PaymentTransaction> {
    await this.ormRepo.update(
      { id: transaction.id },
      {
        companyId: transaction.companyId,
        customerId: transaction.customerId,
        cartSessionId: transaction.cartSessionId,
        orderId: transaction.orderId,
        idempotencyKey: transaction.idempotencyKey,
        provider: transaction.provider,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency,
        mockReference: transaction.mockReference,
        methodType: transaction.methodType,
        last4: transaction.last4,
        brand: transaction.brand,
        metadataJson: transaction.metadataJson as any,
        updatedAt: transaction.updatedAt,
      },
    );
    const updated = await this.ormRepo.findOneByOrFail({ id: transaction.id });
    return this.toDomain(updated);
  }

  async findByIdempotencyKey(
    companyId: string,
    idempotencyKey: string,
  ): Promise<PaymentTransaction | null> {
    const found = await this.ormRepo.findOne({
      where: { companyId, idempotencyKey },
    });
    return found ? this.toDomain(found) : null;
  }

  async findLatestByCartSessionId(
    companyId: string,
    cartSessionId: string,
  ): Promise<PaymentTransaction | null> {
    const found = await this.ormRepo.findOne({
      where: { companyId, cartSessionId },
      order: { createdAt: 'DESC' },
    });
    return found ? this.toDomain(found) : null;
  }
}
