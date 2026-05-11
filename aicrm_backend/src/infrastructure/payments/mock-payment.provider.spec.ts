import { MockPaymentProvider } from './mock-payment.provider';

describe('MockPaymentProvider', () => {
  const provider = new MockPaymentProvider();

  it('returns approved', async () => {
    const result = await provider.simulatePayment({
      companyId: 'c1',
      customerId: 'u1',
      amount: 100,
      currency: 'COP',
      scenario: 'approved',
    });
    expect(result.status).toBe('approved');
  });

  it('returns rejected', async () => {
    const result = await provider.simulatePayment({
      companyId: 'c1',
      customerId: 'u1',
      amount: 100,
      currency: 'COP',
      scenario: 'rejected',
    });
    expect(result.status).toBe('rejected');
  });

  it('returns pending', async () => {
    const result = await provider.simulatePayment({
      companyId: 'c1',
      customerId: 'u1',
      amount: 100,
      currency: 'COP',
      scenario: 'pending',
    });
    expect(result.status).toBe('pending');
  });

  it('handles controlled error', async () => {
    await expect(
      provider.simulatePayment({
        companyId: 'c1',
        customerId: 'u1',
        amount: 100,
        currency: 'COP',
        scenario: 'error',
      }),
    ).rejects.toThrow('Mock payment controlled error');
  });
});
