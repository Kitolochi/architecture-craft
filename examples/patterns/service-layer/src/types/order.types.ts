export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface CreateOrderDTO {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  paymentMethod: PaymentMethod;
}

export interface PaymentMethod {
  type: 'card' | 'bank_transfer';
  token: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface ChargeRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
}

export interface ChargeResult {
  transactionId: string;
  status: 'succeeded' | 'failed';
}
