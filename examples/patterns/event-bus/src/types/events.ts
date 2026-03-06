// Define your application's event map here.
// Each key is an event name, and the value is the payload type.
export interface EventMap {
  'order.created': OrderCreatedEvent;
  'order.cancelled': OrderCancelledEvent;
  'user.registered': UserRegisteredEvent;
  'user.updated': UserUpdatedEvent;
  'payment.processed': PaymentProcessedEvent;
  'inventory.low': InventoryLowEvent;
}

export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  total: number;
  itemCount: number;
}

export interface OrderCancelledEvent {
  orderId: string;
  userId: string;
  reason: string;
}

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  name: string;
}

export interface UserUpdatedEvent {
  userId: string;
  changes: Record<string, unknown>;
}

export interface PaymentProcessedEvent {
  transactionId: string;
  orderId: string;
  amount: number;
  status: 'succeeded' | 'failed';
}

export interface InventoryLowEvent {
  productId: string;
  currentStock: number;
  threshold: number;
}
