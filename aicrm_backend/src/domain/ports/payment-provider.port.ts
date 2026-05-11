export type MockPaymentMethodType =
  | 'mock_card'
  | 'cash_on_delivery'
  | 'bank_transfer_mock';

export type PaymentSimulationScenario =
  | 'approved'
  | 'rejected'
  | 'pending'
  | 'error';

export type PaymentResultStatus =
  | 'approved'
  | 'rejected'
  | 'pending'
  | 'error';

export interface SimulatePaymentInput {
  companyId: string;
  customerId: string;
  amount: number;
  currency: string;
  scenario?: PaymentSimulationScenario;
  methodType?: MockPaymentMethodType;
}

export interface SimulatePaymentOutput {
  status: PaymentResultStatus;
  provider: string;
  reference: string;
  amount: number;
  currency: string;
  methodType: MockPaymentMethodType;
  last4: string | null;
  brand: string | null;
  metadata: Record<string, unknown> | null;
}

export abstract class PaymentProviderPort {
  abstract simulatePayment(
    input: SimulatePaymentInput,
  ): Promise<SimulatePaymentOutput>;
}
