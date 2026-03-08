// Vertical Slice: GetProduct
//
// Retrieves a single product by ID. The query logic, types, and
// validation are all co-located in this file.
//
// In layered architecture, this read operation would share the same
// ProductService and ProductRepository as writes. In vertical slices,
// reads and writes are independent -- you can optimize this query
// without touching the create or list logic.

import type { Request, RequestResult } from '../dispatcher.js';
import { products } from '../store.js';

// --- Types ---

export interface GetProductRequest extends Request {
  type: 'GetProduct';
  productId: string;
}

// --- Validator ---

function validate(request: GetProductRequest): string | null {
  if (!request.productId || request.productId.trim().length === 0) {
    return 'Product ID is required';
  }
  return null;
}

// --- Handler ---

export function handleGetProduct(request: GetProductRequest): RequestResult {
  const error = validate(request);
  if (error) {
    return { success: false, error };
  }

  const product = products.get(request.productId);
  if (!product) {
    return { success: false, error: `Product ${request.productId} not found` };
  }

  console.log(`[GetProduct] Found "${product.name}" (${product.id})`);
  return { success: true, data: product };
}
