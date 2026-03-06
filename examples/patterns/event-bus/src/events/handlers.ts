import type { EventBus } from './event-bus';

// Register all event handlers at startup.
// Each handler is a standalone async function focused on one side effect.

export function registerHandlers(bus: EventBus): void {
  bus.on('order.created', async (event) => {
    console.log(
      `[Email] Sending confirmation for order ${event.orderId} to user ${event.userId}`
    );
    // await emailService.sendOrderConfirmation(event.orderId, event.userId);
  });

  bus.on('order.created', async (event) => {
    console.log(
      `[Inventory] Updating stock for ${event.itemCount} items in order ${event.orderId}`
    );
    // await inventoryService.decrementStock(event.orderId);
  });

  bus.on('order.created', async (event) => {
    console.log(
      `[Analytics] Recording order ${event.orderId}, total: $${event.total}`
    );
    // await analyticsService.trackOrder(event);
  });

  bus.on('order.cancelled', async (event) => {
    console.log(
      `[Inventory] Restoring stock for cancelled order ${event.orderId}`
    );
    // await inventoryService.restoreStock(event.orderId);
  });

  bus.on('order.cancelled', async (event) => {
    console.log(
      `[Email] Sending cancellation notice for order ${event.orderId}`
    );
    // await emailService.sendCancellationNotice(event.orderId, event.userId);
  });

  bus.on('user.registered', async (event) => {
    console.log(`[Email] Sending welcome email to ${event.email}`);
    // await emailService.sendWelcome(event.email, event.name);
  });

  bus.on('user.registered', async (event) => {
    console.log(`[Analytics] New user registered: ${event.userId}`);
    // await analyticsService.trackSignup(event);
  });

  bus.on('payment.processed', async (event) => {
    console.log(
      `[Ledger] Recording payment ${event.transactionId}: $${event.amount} (${event.status})`
    );
    // await ledgerService.recordTransaction(event);
  });

  bus.on('inventory.low', async (event) => {
    console.log(
      `[Alert] Product ${event.productId} stock at ${event.currentStock} (threshold: ${event.threshold})`
    );
    // await alertService.notifyLowStock(event);
  });
}
