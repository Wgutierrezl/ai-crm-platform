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
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    this.drawHeader(doc, input.companyName);
    this.drawOrderInfo(doc, input);
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

  private drawHeader(doc: PDFKit.PDFDocument, companyName: string): void {
    doc
      .fontSize(20)
      .fillColor('#0f172a')
      .text(companyName, { align: 'left' })
      .moveDown(0.4);
    doc
      .fontSize(12)
      .fillColor('#334155')
      .text('Recibo de compra', { align: 'left' });
    doc.moveDown(1);
  }

  private drawOrderInfo(
    doc: PDFKit.PDFDocument,
    input: GeneratePdfReceiptInput,
  ): void {
    const purchaseDate = input.orderDate.toISOString().slice(0, 19).replace('T', ' ');
    doc
      .fontSize(10)
      .fillColor('#0f172a')
      .text(`Orden: ${input.orderId}`)
      .text(`Fecha de compra: ${purchaseDate}`)
      .text(`Cliente: ${input.customerName}`)
      .text(`Email: ${input.customerEmail}`);
    if (input.customerPhone?.trim()) {
      doc.text(`Telefono/WhatsApp: ${input.customerPhone.trim()}`);
    }
    doc.moveDown(1);
  }

  private drawItemsTable(
    doc: PDFKit.PDFDocument,
    input: GeneratePdfReceiptInput,
  ): void {
    const startX = 50;
    let y = doc.y;
    const widths = [210, 70, 110, 110];
    const headers = ['Producto', 'Cant.', 'Precio unitario', 'Subtotal'];

    doc.fontSize(10).fillColor('#ffffff');
    doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), 22).fill('#1d4ed8');

    let x = startX + 6;
    for (let i = 0; i < headers.length; i += 1) {
      doc.text(headers[i], x, y + 6, { width: widths[i] - 8 });
      x += widths[i];
    }

    y += 22;
    doc.fillColor('#0f172a').fontSize(9);
    for (const item of input.items) {
      const subtotal = item.quantity * item.unitPrice;
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), 20).stroke('#cbd5e1');
      let rowX = startX + 6;
      doc.text(item.productName, rowX, y + 6, { width: widths[0] - 8, ellipsis: true });
      rowX += widths[0];
      doc.text(String(item.quantity), rowX, y + 6, { width: widths[1] - 8, align: 'center' });
      rowX += widths[1];
      doc.text(`${item.currency} ${item.unitPrice.toFixed(2)}`, rowX, y + 6, {
        width: widths[2] - 8,
        align: 'right',
      });
      rowX += widths[2];
      doc.text(`${item.currency} ${subtotal.toFixed(2)}`, rowX, y + 6, {
        width: widths[3] - 8,
        align: 'right',
      });
      y += 20;
    }

    doc.moveDown(1.5);
  }

  private drawTotal(doc: PDFKit.PDFDocument, input: GeneratePdfReceiptInput): void {
    doc
      .fontSize(12)
      .fillColor('#0f172a')
      .text(`Total: ${input.currency} ${input.total.toFixed(2)}`, { align: 'right' })
      .moveDown(1);
  }

  private drawPaymentInfo(
    doc: PDFKit.PDFDocument,
    input: GeneratePdfReceiptInput,
  ): void {
    doc
      .fontSize(10)
      .fillColor('#0f172a')
      .text(`Estado de pago mock: ${input.paymentStatus}`)
      .text(`Referencia de transaccion: ${input.paymentReference}`)
      .moveDown(1);
  }

  private drawLegalNote(doc: PDFKit.PDFDocument): void {
    doc
      .fontSize(10)
      .fillColor('#b91c1c')
      .text(
        'Este recibo corresponde a una compra simulada en entorno de prueba. No es una factura legal.',
      );
  }
}
