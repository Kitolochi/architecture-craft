import { Dispatcher } from './dispatcher.js';
import { handleCreateProduct } from './features/create-product.js';
import { handleGetProduct } from './features/get-product.js';
import { handleListProducts } from './features/list-products.js';
import type { CreateProductRequest } from './features/create-product.js';
import type { GetProductRequest } from './features/get-product.js';
import type { ListProductsRequest } from './features/list-products.js';

// Composition root: wire each slice's handler into the dispatcher.
//
// Adding a new feature (e.g., UpdateProduct, DeleteProduct) is just:
// 1. Create a new file in features/
// 2. Register the handler here
//
// No need to touch controllers, services, or repository layers.
// Each slice is a standalone unit of functionality.

const dispatcher = new Dispatcher();

dispatcher.register('CreateProduct', handleCreateProduct);
dispatcher.register('GetProduct', handleGetProduct);
dispatcher.register('ListProducts', handleListProducts);

// --- Demo: exercise each slice through the dispatcher ---

console.log('=== Vertical Slice Architecture Demo ===\n');

// 1. Create several products
const laptop = dispatcher.send<CreateProductRequest>({
  type: 'CreateProduct',
  name: 'ThinkPad X1 Carbon',
  price: 1299.99,
  category: 'Electronics',
});
console.log('Result:', laptop);

const keyboard = dispatcher.send<CreateProductRequest>({
  type: 'CreateProduct',
  name: 'Mechanical Keyboard',
  price: 89.99,
  category: 'Electronics',
});
console.log('Result:', keyboard);

const notebook = dispatcher.send<CreateProductRequest>({
  type: 'CreateProduct',
  name: 'Moleskine Classic',
  price: 19.99,
  category: 'Stationery',
});
console.log('Result:', notebook);

// 2. Validation errors stay within the slice
console.log('\n--- Validation ---');
const invalid = dispatcher.send<CreateProductRequest>({
  type: 'CreateProduct',
  name: '',
  price: -5,
  category: 'Electronics',
});
console.log('Invalid result:', invalid);

// 3. Get a single product
console.log('\n--- Get Product ---');
const found = dispatcher.send<GetProductRequest>({
  type: 'GetProduct',
  productId: (laptop.data as { id: string }).id,
});
console.log('Found:', found);

const notFound = dispatcher.send<GetProductRequest>({
  type: 'GetProduct',
  productId: 'prod-999',
});
console.log('Not found:', notFound);

// 4. List with category filter
console.log('\n--- List Products ---');
const electronics = dispatcher.send<ListProductsRequest>({
  type: 'ListProducts',
  category: 'Electronics',
});
console.log('Electronics:', electronics);

const all = dispatcher.send<ListProductsRequest>({
  type: 'ListProducts',
});
console.log('All products:', all);

export { Dispatcher, dispatcher };
export type { CreateProductRequest, GetProductRequest, ListProductsRequest };
