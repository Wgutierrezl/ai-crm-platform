import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  PaymentProviderPort,
  SimulatePaymentInput,
  SimulatePaymentOutput,
} from '../../domain/ports/payment-provider.port';

@Injectable()
export class MockPaymentProvider implements PaymentProviderPort {
  async simulatePayment(
    input: SimulatePaymentInput,
  ): Promise<SimulatePaymentOutput> {
    const scenario = input.scenario ?? 'approved';
    if (scenario === 'error') {
      throw new Error('Mock payment controlled error');
    }

    return {
      status: scenario,
      provider: 'mock',
      reference: `MOCK-${uuidv4().slice(0, 8).toUpperCase()}`,
      amount: input.amount,
      currency: input.currency,
      methodType: input.methodType ?? 'mock_card',
      last4: '4242',
      brand: 'visa_mock',
      metadata: {
        simulatedAt: new Date().toISOString(),
      },
    };
  }
}
