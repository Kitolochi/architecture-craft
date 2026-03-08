import type { CommandBus } from './command-bus';
import type { OrderWriteStore, OrderReadStore } from '../store/order.store';
import type {
  CreateOrderCommand,
  CancelOrderCommand,
  ShipOrderCommand,
  CommandResult,
} from '../types/order.types';

// Command handlers contain write-side business logic.
// After mutating the write store, they synchronize the read store projection.
// In a real system, this sync would happen via domain events (eventual consistency).

export function registerCommandHandlers(
  bus: CommandBus,
  writeStore: OrderWriteStore,
  readStore: OrderReadStore
): void {
  bus.register<CreateOrderCommand>('CreateOrder', (command) => {
    if (command.items.length === 0) {
      return { success: false, error: 'Order must contain at least one item' };
    }

    for (const item of command.items) {
      if (item.quantity <= 0) {
        return { success: false, error: `Invalid quantity for product ${item.productId}` };
      }
      if (item.unitPrice < 0) {
        return { success: false, error: `Invalid price for product ${item.productId}` };
      }
    }

    const order = writeStore.save({
      userId: command.userId,
      items: command.items,
      status: 'confirmed',
    });

    // Synchronize read model
    readStore.project(order);

    console.log(`[Command] Order ${order.id} created for user ${command.userId}`);
    return { success: true, id: order.id };
  });

  bus.register<CancelOrderCommand>('CancelOrder', (command) => {
    const order = writeStore.findById(command.orderId);
    if (!order) {
      return { success: false, error: `Order ${command.orderId} not found` };
    }

    if (order.status === 'shipped') {
      return { success: false, error: `Cannot cancel shipped order ${command.orderId}` };
    }

    if (order.status === 'cancelled') {
      return { success: false, error: `Order ${command.orderId} is already cancelled` };
    }

    const updated = writeStore.update(command.orderId, { status: 'cancelled' });
    readStore.project(updated);

    console.log(`[Command] Order ${command.orderId} cancelled: ${command.reason}`);
    return { success: true, id: command.orderId };
  });

  bus.register<ShipOrderCommand>('ShipOrder', (command) => {
    const order = writeStore.findById(command.orderId);
    if (!order) {
      return { success: false, error: `Order ${command.orderId} not found` };
    }

    if (order.status !== 'confirmed') {
      return {
        success: false,
        error: `Order ${command.orderId} cannot be shipped (status: ${order.status})`,
      };
    }

    const updated = writeStore.update(command.orderId, {
      status: 'shipped',
      trackingNumber: command.trackingNumber,
    });
    readStore.project(updated);

    console.log(`[Command] Order ${command.orderId} shipped with tracking ${command.trackingNumber}`);
    return { success: true, id: command.orderId };
  });
}
