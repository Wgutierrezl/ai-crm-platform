/**
 * DTOs para Ordenes
 */

// ===== REQUEST DTOs =====

export interface OrderItemRequestDto {
  productId: string;
  quantity: number;
  price: number;
}

export interface CreateOrderRequestDto {
  customerId: string;
  items: OrderItemRequestDto[];
}

// ===== RESPONSE DTOs =====

export type OrderStatus =
  | "pending"
  | "paid"
  | "cancelled"
  | "confirmed"
  | "mock_paid"
  | "payment_failed";

export type PaymentStatus = "approved" | "rejected" | "pending" | "error";

export interface OrderItemDto {
  id: string;
  orderId?: string;
  productId: string;
  companyId?: string;
  quantity: number;
  price: number;
  subtotal?: number;
  product?: {
    id: string;
    name: string;
    description: string | null;
    currency: string | null;
  } | null;
}

export interface OrderCustomerDto {
  id: string;
  name: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

export interface OrderPaymentTransactionDto {
  id: string;
  status: PaymentStatus | string;
  provider: string;
  amount: number;
  currency: string;
  mockReference: string;
  methodType: string | null;
  last4: string | null;
  brand: string | null;
  createdAt: string;
}

export interface OrderDto {
  id: string;
  customerId: string;
  companyId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItemDto[];
  customer?: OrderCustomerDto | null;
  paymentTransaction?: OrderPaymentTransactionDto | null;
}

export type OrderListResponseDto = OrderDto[];
