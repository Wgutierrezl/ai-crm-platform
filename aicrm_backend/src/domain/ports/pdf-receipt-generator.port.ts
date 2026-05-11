export interface PdfReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface GeneratePdfReceiptInput {
  companyName: string;
  orderId: string;
  orderDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  items: PdfReceiptItem[];
  total: number;
  currency: string;
  paymentStatus: string;
  paymentReference: string;
}

export interface GeneratePdfReceiptOutput {
  fileName: string;
  contentType: 'application/pdf';
  contentBase64: string;
}

export abstract class PdfReceiptGeneratorPort {
  abstract generatePurchaseReceipt(
    input: GeneratePdfReceiptInput,
  ): Promise<GeneratePdfReceiptOutput>;
}
