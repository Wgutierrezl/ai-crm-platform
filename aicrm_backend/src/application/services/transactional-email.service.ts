import { Injectable, Logger } from '@nestjs/common';
import { CompanyRepository } from '../../domain/ports/company.repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import { EmailSenderPort } from '../../domain/ports/email-sender.port';
import { PdfReceiptGeneratorPort } from '../../domain/ports/pdf-receipt-generator.port';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';

export interface OrderEmailItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

@Injectable()
export class TransactionalEmailService {
  private readonly logger = new Logger(TransactionalEmailService.name);

  constructor(
    private readonly emailSender: EmailSenderPort,
    private readonly companyRepository: CompanyRepository,
    private readonly pdfReceiptGenerator: PdfReceiptGeneratorPort,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async sendWelcomeOnOnboardingCompleted(input: {
    companyId: string;
    customer: Customer;
    source: 'manual' | 'google_oauth';
  }): Promise<void> {
    if (this.wasWelcomeAlreadySent(input.customer)) {
      this.logger.log('[OnboardingEmail] skipped already_sent');
      return;
    }

    const email = String(input.customer.email ?? '').trim();
    if (!this.isValidEmail(email)) {
      this.logger.log('[OnboardingEmail] skipped invalid_email');
      return;
    }

    const company = await this.companyRepository.findById(input.companyId);
    const companyName = company?.name?.trim() || 'AI CRM';
    const companyLogoUrl = company?.logoUrl?.trim() || null;
    const customerName =
      input.customer.firstName?.trim() ||
      input.customer.fullName?.trim() ||
      'cliente';
    const subject = `Bienvenido a ${companyName}`;
    const html = this.buildWelcomeHtml({ companyName, customerName, companyLogoUrl });

    try {
      await this.emailSender.send({
        to: email,
        subject,
        html,
        text: `Hola ${customerName}, tu registro en ${companyName} fue completado correctamente.`,
      });
      await this.persistWelcomeEmailSent(input.customer, input.source);
      this.logger.log(`[OnboardingEmail] sent source=${input.source}`);
    } catch {
      this.logger.error('[OnboardingEmail] failed but flow continues');
    }
  }

  async sendOrderConfirmation(input: {
    companyId: string;
    customer: Customer | null;
    orderId: string;
    orderDate: Date;
    total: number;
    currency: string;
    paymentStatus: string;
    paymentReference: string;
    items: OrderEmailItem[];
  }): Promise<void> {
    const email = String(input.customer?.email ?? '').trim();
    if (!this.isValidEmail(email)) return;

    const company = await this.companyRepository.findById(input.companyId);
    const companyName = company?.name?.trim() || 'AI CRM';
    const companyLogoUrl = company?.logoUrl?.trim() || null;
    const customerName =
      input.customer?.firstName?.trim() ||
      input.customer?.fullName?.trim() ||
      'cliente';
    const subject = `Confirmacion de compra #${input.orderId.slice(0, 8)}`;
    const html = this.buildOrderHtml({
      companyName,
      customerName,
      companyLogoUrl,
      orderId: input.orderId,
      paymentStatus: input.paymentStatus,
      paymentReference: input.paymentReference,
      total: input.total,
      currency: input.currency,
      items: input.items,
    });
    let attachments:
      | {
          filename: string;
          contentType: string;
          contentBase64: string;
        }[]
      | undefined;

    try {
      const receiptPdf = await this.pdfReceiptGenerator.generatePurchaseReceipt({
        companyName,
        companyLogoUrl,
        orderId: input.orderId,
        orderDate: input.orderDate,
        customerName,
        customerEmail: email,
        customerPhone: input.customer?.phone ?? null,
        items: input.items,
        total: input.total,
        currency: input.currency,
        paymentStatus: input.paymentStatus,
        paymentReference: input.paymentReference,
      });
      attachments = [
        {
          filename: receiptPdf.fileName,
          contentType: receiptPdf.contentType,
          contentBase64: receiptPdf.contentBase64,
        },
      ];
    } catch (error) {
      this.logger.error(
        `Fallo generacion PDF recibo orderId=${input.orderId} companyId=${input.companyId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }

    try {
      await this.emailSender.send({
        to: email,
        subject,
        html,
        text: `Hola ${customerName}, tu compra ${input.orderId.slice(0, 8)} fue confirmada por ${input.currency} ${input.total}.`,
        attachments,
      });
    } catch (error) {
      this.logger.error(
        `Fallo envio order email orderId=${input.orderId} companyId=${input.companyId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }

  isValidEmail(email: string | null | undefined): boolean {
    const value = String(email ?? '').trim();
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  private buildWelcomeHtml(input: {
    companyName: string;
    customerName: string;
    companyLogoUrl: string | null;
  }): string {
    return this.buildLayout({
      companyName: input.companyName,
      companyLogoUrl: input.companyLogoUrl,
      title: `Bienvenido, ${input.customerName}`,
      subtitle: `Tu registro en ${input.companyName} fue completado correctamente.`,
      body: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;">
          <tr>
            <td style="padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
              <p style="margin:0 0 10px;color:#0f172a;font-size:15px;font-weight:600;">Tu cuenta ya esta lista</p>
              <p style="margin:0;color:#475569;font-size:14px;line-height:1.65;">
                Nos alegra tenerte con nosotros. Desde ahora puedes continuar tu experiencia comercial
                y recibir asistencia por WhatsApp de forma mas rapida.
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;border-collapse:separate;border-spacing:0;">
          <tr>
            <td style="padding:0 0 10px;color:#334155;font-size:13px;font-weight:600;">Proximos pasos recomendados</td>
          </tr>
          <tr>
            <td style="padding:0;">
              <p style="margin:0 0 8px;color:#334155;font-size:14px;line-height:1.5;">1. Escribe por WhatsApp para iniciar una conversacion comercial.</p>
              <p style="margin:0 0 8px;color:#334155;font-size:14px;line-height:1.5;">2. Consulta productos y disponibilidad en tiempo real.</p>
              <p style="margin:0;color:#334155;font-size:14px;line-height:1.5;">3. Recibe acompanamiento para completar tu compra.</p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:18px;">
          <tr>
            <td style="padding:14px 16px;border-radius:10px;background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1px solid #bfdbfe;">
              <p style="margin:0;color:#1e3a8a;font-size:14px;font-weight:600;">Tu equipo en ${this.escapeHtml(input.companyName)} ya te puede atender.</p>
            </td>
          </tr>
        </table>
      `,
      footerNote: `Mensaje automatico de ${this.escapeHtml(input.companyName)} enviado por AI CRM.`,
    });
  }

  private buildOrderHtml(input: {
    companyName: string;
    customerName: string;
    companyLogoUrl: string | null;
    orderId: string;
    paymentStatus: string;
    paymentReference: string;
    total: number;
    currency: string;
    items: OrderEmailItem[];
  }): string {
    const rows = input.items
      .map((item) => {
        const subtotal = item.quantity * item.unitPrice;
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#0f172a;">${this.escapeHtml(item.productName)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#334155;text-align:center;">${item.quantity}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#334155;text-align:right;">${this.escapeHtml(item.currency)} ${item.unitPrice.toFixed(2)}</td>
            <td style="padding:10px;border-bottom:1px solid #e2e8f0;color:#0f172a;text-align:right;font-weight:600;">${this.escapeHtml(item.currency)} ${subtotal.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');

    const paymentStatusLabel = this.escapeHtml(input.paymentStatus.toUpperCase());
    const paymentReference = this.escapeHtml(input.paymentReference || 'N/A');

    return this.buildLayout({
      companyName: input.companyName,
      companyLogoUrl: input.companyLogoUrl,
      title: `Compra confirmada #${this.escapeHtml(input.orderId.slice(0, 8))}`,
      subtitle: `Hola ${this.escapeHtml(input.customerName)}, tu pago mock fue aprobado.`,
      body: `
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0;margin-bottom:14px;">
          <tr>
            <td style="padding:14px 16px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;">
              <p style="margin:0 0 8px;color:#0f172a;font-size:14px;font-weight:700;">Resumen de compra</p>
              <p style="margin:0;color:#475569;font-size:13px;line-height:1.5;">
                Orden: <strong style="color:#0f172a;">${this.escapeHtml(input.orderId.slice(0, 8))}</strong><br/>
                Estado de pago: <strong style="color:#166534;">${paymentStatusLabel}</strong><br/>
                Referencia: <strong style="color:#334155;">${paymentReference}</strong>
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <thead>
            <tr>
              <th align="left" style="padding:10px;background:#f1f5f9;color:#334155;border-bottom:1px solid #e2e8f0;">Producto</th>
              <th align="center" style="padding:10px;background:#f1f5f9;color:#334155;border-bottom:1px solid #e2e8f0;">Cant.</th>
              <th align="right" style="padding:10px;background:#f1f5f9;color:#334155;border-bottom:1px solid #e2e8f0;">Precio</th>
              <th align="right" style="padding:10px;background:#f1f5f9;color:#334155;border-bottom:1px solid #e2e8f0;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div style="margin-top:16px;padding:14px;border-radius:12px;background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1px solid #bfdbfe;">
          <strong style="display:block;color:#1d4ed8;font-size:12px;letter-spacing:.4px;text-transform:uppercase;">Total confirmado</strong>
          <strong style="display:block;color:#0f172a;font-size:20px;margin-top:4px;">${this.escapeHtml(input.currency)} ${input.total.toFixed(2)}</strong>
        </div>
        <p style="margin:14px 0 0;color:#475569;font-size:12px;line-height:1.5;">
          Tu compra fue registrada correctamente. Este entorno usa pago simulado para pruebas controladas.
        </p>
      `,
      footerNote: `Confirmacion automatica de compra para ${this.escapeHtml(input.companyName)} via AI CRM.`,
    });
  }

  private buildLayout(input: {
    companyName: string;
    companyLogoUrl: string | null;
    title: string;
    subtitle: string;
    body: string;
    footerNote: string;
  }): string {
    const logoBlock = input.companyLogoUrl
      ? `<img src="${this.escapeHtml(input.companyLogoUrl)}" alt="${this.escapeHtml(input.companyName)}" style="max-height:40px;max-width:160px;display:block;border-radius:6px;" />`
      : `<div style="display:inline-block;padding:8px 12px;border:1px solid rgba(255,255,255,.45);border-radius:8px;font-size:12px;font-weight:700;background:rgba(255,255,255,.12);letter-spacing:.2px;">${this.escapeHtml(input.companyName)}</div>`;

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${this.escapeHtml(input.title)}</title>
        </head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:28px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:660px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #dbeafe;">
                  <tr>
                    <td style="padding:18px 22px;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#ffffff;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:12px;">
                        <tr>
                          <td align="left">${logoBlock}</td>
                          <td align="right" style="font-size:11px;opacity:.95;letter-spacing:.5px;text-transform:uppercase;">
                            ${this.escapeHtml(input.companyName)}
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin:0;font-size:20px;line-height:1.3;">${this.escapeHtml(input.title)}</h1>
                      <p style="margin:8px 0 0;opacity:.95;font-size:14px;">${this.escapeHtml(input.subtitle)}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:20px 22px;">
                      ${input.body}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:14px 22px;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5;">
                      ${input.footerNote}<br/>
                      Mensaje automatico. No responder a este correo.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private wasWelcomeAlreadySent(customer: Customer): boolean {
    return Boolean(customer.metadata?.['welcomeEmailSentAt']);
  }

  private async persistWelcomeEmailSent(
    customer: Customer,
    source: 'manual' | 'google_oauth',
  ): Promise<void> {
    const nextMetadata = {
      ...(customer.metadata ?? {}),
      welcomeEmailSentAt: new Date().toISOString(),
      welcomeEmailSource: source,
    };
    await this.customerRepository.update(
      new Customer(
        customer.id,
        customer.name,
        customer.phone,
        customer.email,
        customer.companyId,
        customer.identificationType,
        customer.identificationNumber,
        customer.firstName,
        customer.lastName,
        customer.fullName,
        customer.address,
        customer.city,
        customer.age,
        nextMetadata,
        customer.onboardingCompleted,
        customer.onboardingStep,
        customer.profileCompletionPercentage,
      ),
    );
  }
}
