// Shared in-memory store for product data.
// In a real system this would be a database. Each slice accesses
// the store directly -- there is no repository abstraction layer.
// This is intentional: vertical slices own their data access logic.

export interface ProductRecord {
  id: string;
  name: string;
  price: number;
  category: string;
  createdAt: Date;
}

let counter = 0;

export function nextId(): string {
  return `prod-${++counter}`;
}

// Simple in-memory table. Each slice reads/writes as needed.
export const products = new Map<string, ProductRecord>();
