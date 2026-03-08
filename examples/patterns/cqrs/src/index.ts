import { CommandBus } from './commands/command-bus';
import { QueryBus } from './queries/query-bus';
import { OrderWriteStore, OrderReadStore } from './store/order.store';
import { registerCommandHandlers } from './commands/order.handlers';
import { registerQueryHandlers } from './queries/order.handlers';
import type {
  CreateOrderCommand,
  CancelOrderCommand,
  ShipOrderCommand,
  GetOrderQuery,
  ListUserOrdersQuery,
  GetOrderSummaryQuery,
} from './types/order.types';

// Composition root: set up the CQRS infrastructure.
// Commands and queries flow through separate buses to enforce the read/write split.

const commandBus = new CommandBus();
const queryBus = new QueryBus();
const writeStore = new OrderWriteStore();
const readStore = new OrderReadStore();

registerCommandHandlers(commandBus, writeStore, readStore);
registerQueryHandlers(queryBus, readStore);

// --- Demo: exercise the full command/query flow ---

// 1. Create an order via command
const createResult = commandBus.dispatch<CreateOrderCommand>({
  type: 'CreateOrder',
  userId: 'user-1',
  items: [
    { productId: 'prod-1', quantity: 2, unitPrice: 29.99 },
    { productId: 'prod-2', quantity: 1, unitPrice: 49.99 },
  ],
});
console.log('Create result:', createResult);

// 2. Query the order from the read side
const order = queryBus.execute<GetOrderQuery, ReturnType<OrderReadStore['findById']>>({
  type: 'GetOrder',
  orderId: createResult.id!,
});
console.log('Order read model:', order);

// 3. Get a summary view
const summary = queryBus.execute<GetOrderSummaryQuery, ReturnType<OrderReadStore['getSummary']>>({
  type: 'GetOrderSummary',
  orderId: createResult.id!,
});
console.log('Order summary:', summary);

// 4. Ship the order
const shipResult = commandBus.dispatch<ShipOrderCommand>({
  type: 'ShipOrder',
  orderId: createResult.id!,
  trackingNumber: 'TRK-12345',
});
console.log('Ship result:', shipResult);

// 5. Try to cancel a shipped order (should fail)
const cancelResult = commandBus.dispatch<CancelOrderCommand>({
  type: 'CancelOrder',
  orderId: createResult.id!,
  reason: 'changed_mind',
});
console.log('Cancel shipped order result:', cancelResult);

// 6. Create and cancel another order
const secondOrder = commandBus.dispatch<CreateOrderCommand>({
  type: 'CreateOrder',
  userId: 'user-1',
  items: [{ productId: 'prod-3', quantity: 1, unitPrice: 99.99 }],
});

commandBus.dispatch<CancelOrderCommand>({
  type: 'CancelOrder',
  orderId: secondOrder.id!,
  reason: 'duplicate_order',
});

// 7. List all orders for the user from the read side
const userOrders = queryBus.execute<ListUserOrdersQuery, ReturnType<OrderReadStore['findByUserId']>>({
  type: 'ListUserOrders',
  userId: 'user-1',
});
console.log(`\nUser orders (${userOrders.length}):`);
for (const o of userOrders) {
  console.log(`  ${o.id}: ${o.status}, $${o.total.toFixed(2)}, ${o.itemCount} items`);
}

export { commandBus, queryBus, CommandBus, QueryBus };
export type {
  Command,
  Query,
  CommandResult,
  OrderWriteModel,
  OrderReadModel,
  OrderSummary,
} from './types/order.types';
