import { ModuleRegistry } from './registry.js';
import { CatalogService } from './modules/catalog/service.js';
import { OrdersService } from './modules/orders/service.js';
import type { CatalogApi } from './modules/catalog/api.js';
import type { OrdersApi } from './modules/orders/api.js';

// Composition root: wire modules through the registry.
//
// Module registration order matters -- modules that depend on others
// must be registered after their dependencies. Here, orders depends
// on catalog, so catalog is registered first.
//
// This is the ONLY place where concrete implementations are referenced.
// All other code works with interfaces (CatalogApi, OrdersApi).

const registry = new ModuleRegistry();

// Register catalog module (no dependencies)
const catalogService = new CatalogService();
registry.register('catalog', catalogService);

// Register orders module (depends on catalog)
const ordersService = new OrdersService(registry);
registry.register('orders', ordersService);

// --- Demo: modules communicate through public APIs only ---

console.log('\n=== Modular Monolith Demo ===\n');

// Resolve modules from registry (as consumers would)
const catalog = registry.resolve<CatalogApi>('catalog');
const orders = registry.resolve<OrdersApi>('orders');

// 1. Create products through the catalog module
console.log('--- Creating Products ---');
const laptop = catalog.createProduct({
  name: 'ThinkPad X1 Carbon',
  price: 1299.99,
  stock: 5,
});

const mouse = catalog.createProduct({
  name: 'Logitech MX Master',
  price: 79.99,
  stock: 20,
});

catalog.createProduct({
  name: 'USB-C Hub',
  price: 49.99,
  stock: 2,
});

// 2. Place an order (orders module calls catalog module through the registry)
console.log('\n--- Placing Orders ---');
const order1 = orders.placeOrder({
  items: [
    { productId: laptop.id, quantity: 1 },
    { productId: mouse.id, quantity: 2 },
  ],
});
console.log('Order result:', order1);

// 3. Check stock was decremented in catalog
console.log('\n--- Stock After Order ---');
const updatedLaptop = catalog.getProduct(laptop.id);
console.log(`Laptop stock: ${updatedLaptop?.stock} (was 5)`);
const updatedMouse = catalog.getProduct(mouse.id);
console.log(`Mouse stock: ${updatedMouse?.stock} (was 20)`);

// 4. Try to order more than available stock
console.log('\n--- Insufficient Stock ---');
const failedOrder = orders.placeOrder({
  items: [{ productId: laptop.id, quantity: 10 }],
});
console.log('Failed order:', failedOrder);

// 5. Cancel an order (stock is released back to catalog)
console.log('\n--- Cancel Order ---');
if ('id' in order1) {
  orders.cancelOrder(order1.id);
  const afterCancel = catalog.getProduct(laptop.id);
  console.log(`Laptop stock after cancel: ${afterCancel?.stock} (restored to 5)`);
}

// 6. List all products and orders
console.log('\n--- Final State ---');
console.log('Products:', catalog.listProducts().map((p) => `${p.name} (stock: ${p.stock})`));
console.log(
  'Orders:',
  orders.listOrders().map((o) => `${o.id}: ${o.status}, $${o.total.toFixed(2)}`)
);

export { ModuleRegistry, registry };
export type { CatalogApi, OrdersApi };
