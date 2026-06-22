import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import {
  GeneratePdfReceiptInput,
  GeneratePdfReceiptOutput,
  PdfReceiptGeneratorPort,
} from '../../domain/ports/pdf-receipt-generator.port';

@Injectable()
export class PdfkitReceiptGenerator implements PdfReceiptGeneratorPort {
  async generatePurchaseReceipt(
    input: GeneratePdfReceiptInput,
  ): Promise<GeneratePdfReceiptOutput> {
    const doc = new PDFDocument({ size: 'A4', margin: 44 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    await this.drawHeader(doc, input.companyName, input.companyLogoUrl ?? null);
    this.drawOrderAndCustomerBlocks(doc, input);
    this.drawItemsTable(doc, input);
    this.drawTotal(doc, input);
    this.drawPaymentInfo(doc, input);
    this.drawLegalNote(doc);

    doc.end();

    const buffer = await new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    return {
      fileName: `recibo-orden-${input.orderId}.pdf`,
      contentType: 'application/pdf',
      contentBase64: buffer.toString('base64'),
    };
  }

  private async drawHeader(
    doc: PDFKit.PDFDocument,
    companyName: string,
    companyLogoUrl: string | null,
  ): Promise<void> {
    const headerTop = 44;
    doc.rect(44, headerTop, 508, 78).fill('#f8fafc').stroke('#e2e8f0');

    const logoBuffer = await this.tryLoadLogo(companyLogoUrl);
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 58, 58, { fit: [145, 44] });
      } catch {
        // Si PDFKit no puede parsear la imagen, continuamos sin bloquear recibo.
      }
    } else {
      doc
        .roundedRect(58, 58, 145, 44, 8)
        .fillAndStroke('#e2e8f0', '#cbd5e1')
        .fillColor('#334155')
        .fontSize(11)
        .text(companyName, 66, 74, { width: 129, align: 'center' });
    }

    doc
      .fontSize(22)
      .fillColor('#0f172a')
      .text(companyName, 220, 60, { align: 'left', width: 320 });
    doc
      .fontSize(11)
      .fillColor('#475569')
      .text('Recibo de compra', 220, 88, { align: 'left' });
    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text('Documento de confirmacion comercial', 220, 103, { align: 'left' });
    doc.moveDown(3.5);
  }

  private async tryLoadLogo(companyLogoUrl: string | null): Promise<Buffer | null> {
    const url = String(companyLogoUrl ?? '').trim();
    if (!url) return null;
    if (!/^https?:\/\//i.test(url)) return null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) return null;
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) return null;

      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer || arrayBuffer.byteLength === 0) return null;
      if (arrayBuffer.byteLength > 2 * 1024 * 1024) return null;

      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  private drawOrderAndCustomerBlocks(
    doc: PDFKit.PDFDocument,
    input: GeneratePdfReceiptInput,
  ): void {
    const purchaseDate = input.orderDate.toISOString().slice(0, 19).replace('T', ' ');
    const startY = doc.y;
    const boxHeight = 96;

    doc.roundedRect(44, startY, 248, boxHeight, 10).fillAndStroke('#ffffff', '#e2e8f0');
    doc.roundedRect(304, startY, 248, boxHeight, 10).fillAndStroke('#ffffff', '#e2e8f0');

    doc
      .fontSize(11)
      .fillColor('#0f172a')
      .text('Datos de orden', 58, startY + 12);
    doc
      .fontSize(9)
      .fillColor('#0f172a')
      .text(`Orden: ${input.orderId}`, 58, startY + 32)
      .text(`Fecha: ${purchaseDate}`, 58, startY + 46)
      .text(`Moneda: ${input.currency}`, 58, startY + 60);

    doc
      .fontSize(11)
      .fillColor('#0f172a')
      .text('Datos de cliente', 318, startY + 12);
    doc
      .fontSize(9)
      .fillColor('#0f172a')
      .text(`Nombre: ${input.customerName}`, 318, startY + 32)
      .text(`Email: ${input.customerEmail}`, 318, startY + 46);
    if (input.customerPhone?.trim()) {
      doc.text(`Telefono: ${input.customerPhone.trim()}`, 318, startY + 60);
    }

    doc.moveTo(44, startY + boxHeight + 16).lineTo(552, startY + boxHeight + 16).stroke('#e2e8f0');
    doc.y = startY + boxHeight + 22;
  }

  private drawItemsTable(
    doc: PDFKit.PDFDocument,
    input: GeneratePdfReceiptInput,
  ): void {
    const startX = 44;
    let y = doc.y;
    const widths = [230, 65, 105, 108];
    const headers = ['Producto', 'Cant.', 'Precio unitario', 'Subtotal'];

    doc.fontSize(10).fillColor('#ffffff');
    doc.roundedRect(startX, y, widths.reduce((a, b) => a + b, 0), 24, 8).fill('#1d4ed8');

    let x = startX + 8;
    for (let i = 0; i < headers.length; i += 1) {
      doc.text(headers[i], x, y + 6, { width: widths[i] - 8 });
      x += widths[i];
    }

    y += 26;
    doc.fontSize(9.5);

    if (input.items.length === 0) {
      doc
        .rect(startX, y, widths.reduce((a, b) => a + b, 0), 28)
        .fillAndStroke('#ffffff', '#e2e8f0');
      doc
        .fillColor('#64748b')
        .text(
          'No hay productos asociados a este recibo.',
          startX + 8,
          y + 9,
          { width: widths.reduce((a, b) => a + b, 0) - 16, align: 'left' },
        );
      doc.y = y + 34;
      doc.moveDown(0.8);
      return;
    }

    for (let idx = 0; idx < input.items.length; idx += 1) {
      const item = input.items[idx];
      const subtotal = item.quantity * item.unitPrice;
      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), 22).fillAndStroke(rowBg, '#e2e8f0');

      // fillAndStroke cambia el color activo; lo restauramos para que el texto siempre sea visible.
      doc.fillColor('#0f172a');

      let rowX = startX + 8;
      doc.text(item.productName, rowX, y + 7, { width: widths[0] - 10, ellipsis: true });
      rowX += widths[0];
      doc.text(String(item.quantity), rowX, y + 7, { width: widths[1] - 10, align: 'center' });
      rowX += widths[1];
      doc.text(`${item.currency} ${item.unitPrice.toFixed(2)}`, rowX, y + 7, {
        width: widths[2] - 10,
        align: 'right',
      });
      rowX += widths[2];
      doc.text(`${item.currency} ${subtotal.toFixed(2)}`, rowX, y + 7, {
        width: widths[3] - 10,
        align: 'right',
      });
      y += 22;
    }

    doc.moveDown(1.5);
  }

  private drawTotal(doc: PDFKit.PDFDocument, input: GeneratePdfReceiptInput): void {
    const boxY = doc.y;
    doc.roundedRect(334, boxY, 218, 58, 10).fillAndStroke('#eff6ff', '#bfdbfe');
    doc
      .fontSize(10)
      .fillColor('#1e3a8a')
      .text('TOTAL COMPRA', 346, boxY + 14);
    doc
      .fontSize(18)
      .fillColor('#0f172a')
      .text(`${input.currency} ${input.total.toFixed(2)}`, 346, boxY + 30, { width: 190, align: 'left' });
    doc.moveDown(3.4);
  }

  private drawPaymentInfo(
    doc: PDFKit.PDFDocument,
    input: GeneratePdfReceiptInput,
  ): void {
    const status = input.paymentStatus.toUpperCase();
    doc.roundedRect(44, doc.y, 508, 56, 10).fillAndStroke('#f8fafc', '#e2e8f0');
    doc
      .fontSize(10.5)
      .fillColor('#0f172a')
      .text(`Estado de pago mock: ${status}`, 58, doc.y + 14)
      .text(`Referencia transaccion: ${input.paymentReference}`, 58, doc.y + 30)
      .moveDown(3.2);
  }

  private drawLegalNote(doc: PDFKit.PDFDocument): void {
    doc.roundedRect(44, doc.y, 508, 46, 8).fillAndStroke('#fef2f2', '#fecaca');
    doc
      .fontSize(9.8)
      .fillColor('#b91c1c')
      .text('Nota legal', 58, doc.y + 12)
      .text(
        'Este recibo corresponde a una compra simulada en entorno de prueba. No es una factura legal.',
        58,
        doc.y + 26,
      );
  }
}
