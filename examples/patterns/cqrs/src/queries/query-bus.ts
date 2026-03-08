import type { Query } from '../types/order.types';

// A query handler reads data without side effects.
// Queries are questions ("give me this") -- they never change state.
type QueryHandler<T extends Query, R> = (query: T) => R;

export class QueryBus {
  private handlers = new Map<string, QueryHandler<any, any>>();

  // Register a handler for a specific query type.
  // Like commands, each query type has exactly one handler.
  register<T extends Query, R>(type: T['type'], handler: QueryHandler<T, R>): void {
    if (this.handlers.has(type)) {
      throw new Error(`Handler already registered for query: ${type}`);
    }
    this.handlers.set(type, handler);
  }

  // Execute a query and return the result.
  // Throws if no handler is found.
  execute<T extends Query, R>(query: T): R {
    const handler = this.handlers.get(query.type);
    if (!handler) {
      throw new Error(`No handler registered for query: ${query.type}`);
    }
    return handler(query);
  }
}
