import type { QueryBus } from './query-bus';
import type { OrderReadStore } from '../store/order.store';
import type {
  GetOrderQuery,
  ListUserOrdersQuery,
  GetOrderSummaryQuery,
  OrderReadModel,
  OrderSummary,
} from '../types/order.types';

// Query handlers read from the denormalized read store.
// They never touch the write store -- this is the core CQRS separation.
// The read store is optimized for the exact shape each query needs.

export function registerQueryHandlers(
  bus: QueryBus,
  readStore: OrderReadStore
): void {
  bus.register<GetOrderQuery, OrderReadModel | null>('GetOrder', (query) => {
    return readStore.findById(query.orderId);
  });

  bus.register<ListUserOrdersQuery, OrderReadModel[]>('ListUserOrders', (query) => {
    return readStore.findByUserId(
      query.userId,
      query.limit ?? 50,
      query.offset ?? 0
    );
  });

  bus.register<GetOrderSummaryQuery, OrderSummary | null>('GetOrderSummary', (query) => {
    return readStore.getSummary(query.orderId);
  });
}
