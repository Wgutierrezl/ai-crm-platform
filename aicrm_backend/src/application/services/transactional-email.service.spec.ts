import { TransactionalEmailService } from './transactional-email.service';
import { Customer } from '../../domain/entities/customer.entity';

describe('TransactionalEmailService', () => {
  const companyId = 'company-1';
  const companyRepository = {
    findById: jest.fn().mockResolvedValue({ id: companyId, name: 'AI CRM Co' }),
  };

  const build = () => {
    const emailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    const service = new TransactionalEmailService(
      emailSender as any,
      companyRepository as any,
    );
    return { service, emailSender };
  };

  const customer = (email: string | null) =>
    new Customer(
      'customer-1',
      'Ana',
      '300',
      email,
      companyId,
      null,
      null,
      'Ana',
      null,
      'Ana Diaz',
    );

  it('does not send welcome email when customer has no email', async () => {
    const { service, emailSender } = build();
    await service.sendWelcomeOnOnboardingCompleted({
      companyId,
      customer: customer(null),
    });
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it('sends welcome email when onboarding is completed and email is valid', async () => {
    const { service, emailSender } = build();
    await service.sendWelcomeOnOnboardingCompleted({
      companyId,
      customer: customer('ana@example.com'),
    });
    expect(emailSender.send).toHaveBeenCalledTimes(1);
  });

  it('sends order confirmation email when checkout approved and customer email exists', async () => {
    const { service, emailSender } = build();
    await service.sendOrderConfirmation({
      companyId,
      customer: customer('ana@example.com'),
      orderId: 'order-12345678',
      total: 200,
      currency: 'COP',
      items: [
        { productName: 'Producto 1', quantity: 2, unitPrice: 100, currency: 'COP' },
      ],
    });
    expect(emailSender.send).toHaveBeenCalledTimes(1);
  });

  it('does not throw when smtp sender fails', async () => {
    const emailSender = {
      send: jest.fn().mockRejectedValue(new Error('smtp down')),
    };
    const service = new TransactionalEmailService(
      emailSender as any,
      companyRepository as any,
    );
    await expect(
      service.sendOrderConfirmation({
        companyId,
        customer: customer('ana@example.com'),
        orderId: 'order-12345678',
        total: 200,
        currency: 'COP',
        items: [
          { productName: 'Producto 1', quantity: 2, unitPrice: 100, currency: 'COP' },
        ],
      }),
    ).resolves.toBeUndefined();
  });
});

