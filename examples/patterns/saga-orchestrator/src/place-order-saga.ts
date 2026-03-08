// PlaceOrder saga definition.
//
// This saga coordinates three services to place an order:
// 1. Reserve inventory (compensate: unreserve)
// 2. Charge payment   (compensate: refund)
// 3. Send confirmation (compensate: send cancellation notice)
//
// If payment fails at step 2, inventory is automatically unreserved.
// If notification fails at step 3, payment is refunded AND inventory unreserved.

import { SagaOrchestrator } from './orchestrator.js';
import type { InventoryService, PaymentService, NotificationService } from './services.js';

export interface PlaceOrderContext {
  orderId: string;
  email: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  // Populated during saga execution
  transactionId?: string;
  totalAmount?: number;
}

export function createPlaceOrderSaga(
  inventory: InventoryService,
  payment: PaymentService,
  notification: NotificationService
): SagaOrchestrator<PlaceOrderContext> {
  const saga = new SagaOrchestrator<PlaceOrderContext>();

  // Step 1: Reserve inventory for all items
  saga.addStep({
    name: 'Reserve Inventory',
    execute: async (ctx) => {
      for (const item of ctx.items) {
        await inventory.reserve(item.productId, item.quantity);
      }
    },
    compensate: async (ctx) => {
      for (const item of ctx.items) {
        await inventory.unreserve(item.productId, item.quantity);
      }
    },
  });

  // Step 2: Charge payment
  saga.addStep({
    name: 'Charge Payment',
    execute: async (ctx) => {
      ctx.totalAmount = ctx.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      ctx.transactionId = await payment.charge(ctx.orderId, ctx.totalAmount);
    },
    compensate: async (ctx) => {
      if (ctx.transactionId) {
        await payment.refund(ctx.transactionId);
      }
    },
  });

  // Step 3: Send confirmation
  saga.addStep({
    name: 'Send Confirmation',
    execute: async (ctx) => {
      await notification.sendConfirmation(ctx.orderId, ctx.email);
    },
    compensate: async (ctx) => {
      await notification.sendCancellation(ctx.orderId, ctx.email);
    },
  });

  return saga;
}
