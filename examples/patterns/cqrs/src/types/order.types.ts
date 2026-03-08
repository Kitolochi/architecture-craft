// Write model: captures intent via commands
export interface CreateOrderCommand {
  type: 'CreateOrder';
  userId: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
}

export interface CancelOrderCommand {
  type: 'CancelOrder';
  orderId: string;
  reason: string;
}

export interface ShipOrderCommand {
  type: 'ShipOrder';
  orderId: string;
  trackingNumber: string;
}

export type Command = CreateOrderCommand | CancelOrderCommand | ShipOrderCommand;

// Read model: optimized for queries
export interface GetOrderQuery {
  type: 'GetOrder';
  orderId: string;
}

export interface ListUserOrdersQuery {
  type: 'ListUserOrders';
  userId: string;
  limit?: number;
  offset?: number;
}

export interface GetOrderSummaryQuery {
  type: 'GetOrderSummary';
  orderId: string;
}

export type Query = GetOrderQuery | ListUserOrdersQuery | GetOrderSummaryQuery;

// Domain types shared across read and write sides
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'cancelled';

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

// Write model representation
export interface OrderWriteModel {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Read model representation (denormalized for fast reads)
export interface OrderReadModel {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  itemCount: number;
  trackingNumber?: string;
  createdAt: Date;
}

// Flattened summary for list views
export interface OrderSummary {
  id: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: Date;
}

// Command results
export interface CommandResult {
  success: boolean;
  id?: string;
  error?: string;
}
