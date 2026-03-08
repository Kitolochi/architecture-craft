// Orders module types.
// Orders reference products by ID -- they never embed catalog internals.

export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
}

export interface PlaceOrderInput {
  items: Array<{ productId: string; quantity: number }>;
}
