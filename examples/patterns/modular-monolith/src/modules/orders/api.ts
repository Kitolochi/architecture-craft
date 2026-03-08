// Orders module public API (interface).
//
// Like the catalog API, this is the contract other modules depend on.
// The orders module needs catalog data (product names, prices, stock),
// but it accesses catalog through the registry, not direct imports.

import type { Order, PlaceOrderInput } from './types.js';

export interface OrdersApi {
  placeOrder(input: PlaceOrderInput): Order | { error: string };
  getOrder(id: string): Order | null;
  listOrders(): Order[];
  cancelOrder(id: string): boolean;
}
