// Vertical Slice: CreateProduct
//
// Everything needed to create a product lives in this one file:
// the request type, validation, and handler logic.
//
// Compare with layered architecture where this operation would be
// spread across: ProductController, ProductService, ProductRepository,
// CreateProductDTO, ProductValidator -- all in different directories.
//
// When you need to change how products are created, you only touch this file.

import type { Request, RequestResult } from '../dispatcher.js';
import { products, nextId } from '../store.js';

// --- Types (the slice's contract) ---

export interface CreateProductRequest extends Request {
  type: 'CreateProduct';
  name: string;
  price: number;
  category: string;
}

// --- Validator (inline, not a shared validation layer) ---

function validate(request: CreateProductRequest): string | null {
  if (!request.name || request.name.trim().length === 0) {
    return 'Product name is required';
  }
  if (request.name.length > 200) {
    return 'Product name must be 200 characters or fewer';
  }
  if (request.price < 0) {
    return 'Price cannot be negative';
  }
  if (!request.category || request.category.trim().length === 0) {
    return 'Category is required';
  }
  return null;
}

// --- Handler (the slice's logic) ---

export function handleCreateProduct(request: CreateProductRequest): RequestResult {
  const error = validate(request);
  if (error) {
    return { success: false, error };
  }

  const id = nextId();
  const record = {
    id,
    name: request.name.trim(),
    price: request.price,
    category: request.category.trim(),
    createdAt: new Date(),
  };

  products.set(id, record);
  console.log(`[CreateProduct] Created "${record.name}" (${id}) at $${record.price}`);

  return { success: true, data: record };
}
