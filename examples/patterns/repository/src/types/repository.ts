export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;

  findAll(options?: {
    filter?: Partial<T>;
    limit?: number;
    offset?: number;
  }): Promise<T[]>;

  create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;

  update(id: ID, data: Partial<T>): Promise<T>;

  delete(id: ID): Promise<void>;

  count(filter?: Partial<T>): Promise<number>;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
