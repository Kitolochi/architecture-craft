// Catalog module types.
// These are the public data shapes other modules can depend on.

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CreateProductInput {
  name: string;
  price: number;
  stock: number;
}
