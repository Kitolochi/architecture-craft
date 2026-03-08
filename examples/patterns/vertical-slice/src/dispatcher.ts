// MediatR-style dispatcher that routes requests to the correct slice handler.
//
// In layered architecture, a "create product" operation touches:
//   Controller -> Service -> Repository -> Database
// Each layer is a horizontal slice across ALL features.
//
// In vertical slice architecture, each feature is a self-contained unit:
//   CreateProduct slice = handler + validator + types (all in one place)
// Adding a feature means adding a new slice, not modifying existing layers.
//
// The dispatcher is the only shared infrastructure. It connects the entry
// point (API route, CLI command, etc.) to the correct slice handler.

export interface Request {
  type: string;
}

export interface RequestResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

type RequestHandler<T extends Request> = (request: T) => RequestResult;

export class Dispatcher {
  private handlers = new Map<string, RequestHandler<any>>();

  // Register a handler for a specific request type.
  // Each request type maps to exactly one handler -- the slice that owns it.
  register<T extends Request>(type: string, handler: RequestHandler<T>): void {
    if (this.handlers.has(type)) {
      throw new Error(`Handler already registered for request: ${type}`);
    }
    this.handlers.set(type, handler);
  }

  // Send a request through the pipeline to its handler.
  // This is the single entry point for all feature operations.
  send<T extends Request>(request: T): RequestResult {
    const handler = this.handlers.get(request.type);
    if (!handler) {
      throw new Error(`No handler registered for request: ${request.type}`);
    }
    return handler(request);
  }
}
