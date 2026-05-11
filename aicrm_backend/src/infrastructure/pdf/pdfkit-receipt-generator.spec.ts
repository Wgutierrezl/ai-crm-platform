import { PdfkitReceiptGenerator } from './pdfkit-receipt-generator';

describe('PdfkitReceiptGenerator', () => {
  it('generates a real pdf payload in base64', async () => {
    const generator = new PdfkitReceiptGenerator();

    const output = await generator.generatePurchaseReceipt({
      companyName: 'AI CRM Co',
      orderId: 'order-123',
      orderDate: new Date('2026-05-11T10:00:00Z'),
      customerName: 'Ana Diaz',
      customerEmail: 'ana@example.com',
      customerPhone: '3001234567',
      items: [{ productName: 'Producto 1', quantity: 2, unitPrice: 100, currency: 'COP' }],
      total: 200,
      currency: 'COP',
      paymentStatus: 'approved',
      paymentReference: 'MOCK-ABC',
    });

    expect(output.fileName).toBe('recibo-orden-order-123.pdf');
    expect(output.contentType).toBe('application/pdf');
    expect(output.contentBase64.length).toBeGreaterThan(100);
    const header = Buffer.from(output.contentBase64, 'base64').subarray(0, 4).toString();
    expect(header).toBe('%PDF');
  });
});
