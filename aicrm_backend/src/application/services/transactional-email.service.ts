import { Injectable, Logger } from '@nestjs/common';
import { CompanyRepository } from '../../domain/ports/company.repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import { EmailSenderPort } from '../../domain/ports/email-sender.port';
import { PdfReceiptGeneratorPort } from '../../domain/ports/pdf-receipt-generator.port';

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
  ) {}

  async sendWelcomeOnOnboardingCompleted(input: {
    companyId: string;
    customer: Customer;
  }): Promise<void> {
    const email = String(input.customer.email ?? '').trim();
    if (!this.isValidEmail(email)) return;

    const company = await this.companyRepository.findById(input.companyId);
    const companyName = company?.name?.trim() || 'AI CRM';
    const customerName =
      input.customer.firstName?.trim() ||
      input.customer.fullName?.trim() ||
      'cliente';
    const subject = `Bienvenido a ${companyName}`;
    const html = this.buildWelcomeHtml({ companyName, customerName });

    try {
      await this.emailSender.send({
        to: email,
        subject,
        html,
        text: `Hola ${customerName}, tu registro en ${companyName} fue completado correctamente.`,
      });
    } catch (error) {
      this.logger.error(
        `Fallo envio welcome email customerId=${input.customer.id} companyId=${input.companyId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
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
    const customerName =
      input.customer?.firstName?.trim() ||
      input.customer?.fullName?.trim() ||
      'cliente';
    const subject = `Confirmacion de compra #${input.orderId.slice(0, 8)}`;
    const html = this.buildOrderHtml({
      companyName,
      customerName,
      orderId: input.orderId,
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
  }): string {
    return this.buildLayout({
      title: `Bienvenido, ${input.customerName}`,
      subtitle: `Tu registro en ${input.companyName} fue completado correctamente.`,
      body: `
        <p style="margin:0 0 16px;color:#334155;">Nos alegra tenerte con nosotros. Ya puedes continuar tu experiencia de compra y recibir asistencia comercial por WhatsApp.</p>
        <p style="margin:0;color:#0f172a;font-weight:600;">Gracias por confiar en ${this.escapeHtml(input.companyName)}.</p>
      `,
    });
  }

  private buildOrderHtml(input: {
    companyName: string;
    customerName: string;
    orderId: string;
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

    return this.buildLayout({
      title: `Compra confirmada #${this.escapeHtml(input.orderId.slice(0, 8))}`,
      subtitle: `Hola ${this.escapeHtml(input.customerName)}, tu pago mock fue aprobado.`,
      body: `
        <p style="margin:0 0 12px;color:#334155;">Resumen de tu compra en ${this.escapeHtml(input.companyName)}:</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px;">
          <thead>
            <tr>
              <th align="left" style="padding:10px;background:#f8fafc;color:#334155;border-bottom:1px solid #e2e8f0;">Producto</th>
              <th align="center" style="padding:10px;background:#f8fafc;color:#334155;border-bottom:1px solid #e2e8f0;">Cant.</th>
              <th align="right" style="padding:10px;background:#f8fafc;color:#334155;border-bottom:1px solid #e2e8f0;">Precio</th>
              <th align="right" style="padding:10px;background:#f8fafc;color:#334155;border-bottom:1px solid #e2e8f0;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div style="margin-top:16px;padding:12px;border-radius:10px;background:#eff6ff;border:1px solid #bfdbfe;">
          <strong style="color:#1d4ed8;">Total: ${this.escapeHtml(input.currency)} ${input.total.toFixed(2)}</strong>
        </div>
        <p style="margin:14px 0 0;color:#475569;font-size:12px;">Pago simulado aprobado en entorno de prueba.</p>
      `,
    });
  }

  private buildLayout(input: {
    title: string;
    subtitle: string;
    body: string;
  }): string {
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${this.escapeHtml(input.title)}</title>
        </head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #dbeafe;">
                  <tr>
                    <td style="padding:18px 22px;background:linear-gradient(135deg,#1d4ed8,#0ea5e9);color:#ffffff;">
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
                    <td style="padding:14px 22px;background:#f8fafc;color:#64748b;font-size:12px;">
                      Mensaje automatico de AI CRM. No responder a este correo.
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
}
