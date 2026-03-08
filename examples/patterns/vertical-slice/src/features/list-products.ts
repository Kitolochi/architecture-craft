// Vertical Slice: ListProducts
//
// Returns products filtered by category with pagination.
// This slice has its own query shape and filtering logic.
//
// In layered architecture, adding a "filter by category" feature
// means changing the controller, service, and repository layers.
// In vertical slices, you add or modify just this one file.

import type { Request, RequestResult } from '../dispatcher.js';
import { products } from '../store.js';

// --- Types ---

export interface ListProductsRequest extends Request {
  type: 'ListProducts';
  category?: string;
  limit?: number;
  offset?: number;
}

interface ProductListItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

// --- Validator ---

function validate(request: ListProductsRequest): string | null {
  if (request.limit !== undefined && request.limit < 1) {
    return 'Limit must be at least 1';
  }
  if (request.offset !== undefined && request.offset < 0) {
    return 'Offset cannot be negative';
  }
  return null;
}

// --- Handler ---

export function handleListProducts(request: ListProductsRequest): RequestResult {
  const error = validate(request);
  if (error) {
    return { success: false, error };
  }

  const limit = request.limit ?? 20;
  const offset = request.offset ?? 0;

  let results = Array.from(products.values());

  // Filter by category if specified
  if (request.category) {
    results = results.filter(
      (p) => p.category.toLowerCase() === request.category!.toLowerCase()
    );
  }

  // Sort by creation date (newest first) and paginate
  const items: ProductListItem[] = results
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(offset, offset + limit)
    .map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      category: p.category,
    }));

  console.log(
    `[ListProducts] Found ${items.length} products` +
      (request.category ? ` in category "${request.category}"` : '')
  );

  return {
    success: true,
    data: { items, total: results.length, limit, offset },
  };
}
