// Catalog module internal implementation.
//
// This file is PRIVATE to the catalog module. Other modules must not
// import from here -- they use the CatalogApi interface via the registry.
//
// The internal implementation can change freely (swap storage, add caching,
// refactor logic) without breaking other modules.

import type { CatalogApi } from './api.js';
import type { Product, CreateProductInput } from './types.js';

let counter = 0;

export class CatalogService implements CatalogApi {
  private products = new Map<string, Product>();

  createProduct(input: CreateProductInput): Product {
    const id = `prod-${++counter}`;
    const product: Product = { id, ...input };
    this.products.set(id, product);
    console.log(`[Catalog] Created product "${product.name}" (${id}), stock: ${product.stock}`);
    return product;
  }

  getProduct(id: string): Product | null {
    return this.products.get(id) ?? null;
  }

  listProducts(): Product[] {
    return Array.from(this.products.values());
  }

  reserveStock(productId: string, quantity: number): boolean {
    const product = this.products.get(productId);
    if (!product) {
      console.log(`[Catalog] Cannot reserve: product ${productId} not found`);
      return false;
    }
    if (product.stock < quantity) {
      console.log(
        `[Catalog] Cannot reserve ${quantity} of "${product.name}": only ${product.stock} in stock`
      );
      return false;
    }
    product.stock -= quantity;
    console.log(
      `[Catalog] Reserved ${quantity} of "${product.name}", remaining: ${product.stock}`
    );
    return true;
  }

  releaseStock(productId: string, quantity: number): void {
    const product = this.products.get(productId);
    if (!product) return;
    product.stock += quantity;
    console.log(
      `[Catalog] Released ${quantity} of "${product.name}", remaining: ${product.stock}`
    );
  }
}
