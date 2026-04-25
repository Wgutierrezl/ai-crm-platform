/**
 * DTOs para Órdenes
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

export type OrderStatus = "pending" | "paid" | "cancelled";

export interface OrderItemDto {
  id: string;
  orderId: string;
  productId: string;
  companyId: string;
  quantity: number;
  price: number;
}

export interface OrderDto {
  id: string;
  customerId: string;
  companyId: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items?: OrderItemDto[];
}

export type OrderListResponseDto = OrderDto[];
