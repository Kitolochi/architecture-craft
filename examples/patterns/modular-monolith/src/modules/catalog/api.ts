// Catalog module public API (interface).
//
// This is the contract other modules program against.
// The implementation is hidden behind this interface -- other modules
// import CatalogApi, never the internal CatalogService directly.
//
// When extracting to a microservice:
// 1. This interface stays the same
// 2. Replace the in-process implementation with an HTTP client
// 3. No changes needed in consuming modules (e.g., orders)

import type { Product, CreateProductInput } from './types.js';

export interface CatalogApi {
  createProduct(input: CreateProductInput): Product;
  getProduct(id: string): Product | null;
  listProducts(): Product[];
  reserveStock(productId: string, quantity: number): boolean;
  releaseStock(productId: string, quantity: number): void;
}
