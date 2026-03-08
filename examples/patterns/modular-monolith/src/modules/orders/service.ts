// Orders module internal implementation.
//
// This module depends on the catalog module's PUBLIC API only.
// It resolves the catalog module through the registry at construction time.
//
// Notice: we import CatalogApi (the interface) and catalog types,
// but NEVER import CatalogService (the implementation). This is the
// boundary that makes extraction to microservices possible.
//
// To extract orders as a microservice:
// 1. Replace registry.resolve<CatalogApi>('catalog') with an HTTP client
// 2. The HTTP client implements the same CatalogApi interface
// 3. Orders module code stays unchanged

import type { OrdersApi } from './api.js';
import type { Order, PlaceOrderInput, OrderItem } from './types.js';
import type { CatalogApi } from '../catalog/api.js';
import type { ModuleRegistry } from '../../registry.js';

let counter = 0;

export class OrdersService implements OrdersApi {
  private orders = new Map<string, Order>();
  private catalog: CatalogApi;

  constructor(registry: ModuleRegistry) {
    this.catalog = registry.resolve<CatalogApi>('catalog');
  }

  placeOrder(input: PlaceOrderInput): Order | { error: string } {
    if (input.items.length === 0) {
      return { error: 'Order must contain at least one item' };
    }

    // Validate all items exist and have stock BEFORE reserving anything
    const orderItems: OrderItem[] = [];
    for (const item of input.items) {
      const product = this.catalog.getProduct(item.productId);
      if (!product) {
        return { error: `Product ${item.productId} not found` };
      }
      orderItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    // Reserve stock for all items (roll back on failure)
    const reserved: Array<{ productId: string; quantity: number }> = [];
    for (const item of input.items) {
      const success = this.catalog.reserveStock(item.productId, item.quantity);
      if (!success) {
        // Roll back previously reserved items
        for (const r of reserved) {
          this.catalog.releaseStock(r.productId, r.quantity);
        }
        return { error: `Insufficient stock for product ${item.productId}` };
      }
      reserved.push({ productId: item.productId, quantity: item.quantity });
    }

    const id = `order-${++counter}`;
    const total = orderItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const order: Order = {
      id,
      items: orderItems,
      status: 'confirmed',
      total,
      createdAt: new Date(),
    };

    this.orders.set(id, order);
    console.log(`[Orders] Placed order ${id}, total: $${total.toFixed(2)}`);
    return order;
  }

  getOrder(id: string): Order | null {
    return this.orders.get(id) ?? null;
  }

  listOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  cancelOrder(id: string): boolean {
    const order = this.orders.get(id);
    if (!order || order.status === 'cancelled') {
      return false;
    }

    // Release reserved stock back to catalog
    for (const item of order.items) {
      this.catalog.releaseStock(item.productId, item.quantity);
    }

    order.status = 'cancelled';
    console.log(`[Orders] Cancelled order ${id}`);
    return true;
  }
}
