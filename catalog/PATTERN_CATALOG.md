# Pattern Catalog

Implementable architecture patterns organized by category with code templates, configuration snippets, and build priority tiers.

**Build Priority Tiers**:
- **P0 (Foundation)**: Set up before writing application code
- **P1 (Core)**: Implement during initial feature development
- **P2 (Scale)**: Add when complexity or traffic demands it
- **P3 (Optimize)**: Refine after system is stable in production

---

## 1. Monorepo Setup

### Turborepo Configuration [P0]

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

```
my-turborepo/
  apps/
    web/          # Next.js app
    api/          # Express/Fastify service
  packages/
    ui/           # Shared components
    config/       # Shared ESLint, TS configs
    types/        # Shared TypeScript types
  turbo.json
  package.json
  pnpm-workspace.yaml
```

```bash
npx create-turbo@latest my-monorepo
cd my-monorepo && pnpm install
pnpm turbo build         # Build all packages respecting dependency graph
pnpm turbo build --filter=web  # Build only web app and its deps
```

### Nx Workspace [P0]

```json
// nx.json
{
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
      "cache": true
    }
  },
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": ["default", "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)"],
    "sharedGlobals": []
  },
  "defaultBase": "main"
}
```

```bash
npx create-nx-workspace@latest my-workspace --preset=ts
cd my-workspace
npx nx generate @nx/node:application api      # Generate app
npx nx generate @nx/react:library ui           # Generate library
npx nx affected --target=build                 # Build only affected
npx nx graph                                    # Visualize dependency graph
```

### pnpm Workspaces [P0]

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// Root package.json
{
  "scripts": {
    "build": "pnpm -r --filter './packages/**' build && pnpm -r --filter './apps/**' build",
    "dev": "pnpm -r --parallel dev",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
  }
}
```

```bash
# Cross-package dependencies
cd apps/web && pnpm add @myorg/ui --workspace
# Runs "build" in all packages, topological order
pnpm -r build
# Runs "dev" in all packages, parallel
pnpm -r --parallel dev
```

---

## 2. Project Structure

### Feature-Based Layout [P0]

```
src/
  features/
    auth/
      components/
        LoginForm.tsx
        SignupForm.tsx
      hooks/
        useAuth.ts
        useSession.ts
      api/
        auth.api.ts         # API calls
        auth.queries.ts     # React Query hooks
      store/
        auth.store.ts       # Zustand/Redux slice
      types/
        auth.types.ts
      __tests__/
        auth.api.test.ts
        useAuth.test.ts
    dashboard/
      components/
      hooks/
      api/
      store/
      types/
  shared/
    components/              # Truly shared UI primitives
    hooks/                   # Cross-cutting hooks
    utils/                   # Pure utility functions
    types/                   # Global type definitions
  app/                       # App shell, routing, providers
    routes/
    providers/
    App.tsx
```

**Rules**:
- Features never import from other features directly (use shared or events).
- Shared code must be used by 3+ features before extracting.
- Import directly: `import { LoginForm } from '@/features/auth/components/LoginForm'`.

### Barrel Exports: When to Use [P0]

```ts
// packages/ui/src/index.ts  -- YES: public package API
export { Button } from './Button';
export { Input } from './Input';
export type { ButtonProps, InputProps } from './types';

// src/features/auth/components/index.ts  -- NO: internal barrel
// Don't create this. Import directly instead.
```

**Rule**: Barrel files only at package boundaries (npm packages, workspace packages). Never within app source code.

### Dependency Injection Patterns [P1]

**TSyringe (decorator-based)**:

```ts
// container.ts
import 'reflect-metadata';
import { container } from 'tsyringe';

container.register('DATABASE_URL', { useValue: process.env.DATABASE_URL });
export { container };

// user.repository.ts
import { injectable, inject } from 'tsyringe';

@injectable()
export class UserRepository {
  constructor(@inject('DATABASE_URL') private dbUrl: string) {}

  async findById(id: string): Promise<User | null> {
    // ...
  }
}

// user.service.ts
@injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {} // Auto-resolved

  async getUser(id: string) {
    return this.userRepo.findById(id);
  }
}

// main.ts
import { container } from './container';
const userService = container.resolve(UserService);
```

**Awilix (no decorators)**:

```ts
import { createContainer, asClass, asValue, InjectionMode } from 'awilix';

const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

container.register({
  userRepository: asClass(UserRepository).scoped(),
  userService: asClass(UserService).scoped(),
  dbUrl: asValue(process.env.DATABASE_URL),
});

const userService = container.resolve<UserService>('userService');
```

---

## 3. Design Patterns

### Repository Pattern [P1]

```ts
// types/repository.ts
interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: { filter?: Partial<T>; limit?: number; offset?: number }): Promise<T[]>;
  create(entity: Omit<T, 'id' | 'createdAt'>): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
  count(filter?: Partial<T>): Promise<number>;
}

// repositories/user.repository.ts
class PrismaUserRepository implements Repository<User> {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findAll({ filter, limit = 50, offset = 0 } = {}) {
    return this.prisma.user.findMany({ where: filter, take: limit, skip: offset });
  }

  async create(data) {
    return this.prisma.user.create({ data });
  }

  async update(id, data) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async delete(id) {
    await this.prisma.user.delete({ where: { id } });
  }

  async count(filter) {
    return this.prisma.user.count({ where: filter });
  }
}
```

### Service Layer [P1]

```ts
// services/order.service.ts
class OrderService {
  constructor(
    private orderRepo: Repository<Order>,
    private productRepo: Repository<Product>,
    private paymentGateway: PaymentGateway,
    private eventBus: EventBus
  ) {}

  async createOrder(dto: CreateOrderDTO): Promise<Order> {
    // Validate stock
    for (const item of dto.items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product || product.stock < item.quantity) {
        throw new InsufficientStockError(item.productId);
      }
    }

    // Create order
    const order = await this.orderRepo.create({
      userId: dto.userId,
      items: dto.items,
      status: 'pending',
      total: this.calculateTotal(dto.items),
    });

    // Process payment
    await this.paymentGateway.charge({
      orderId: order.id,
      amount: order.total,
      method: dto.paymentMethod,
    });

    // Publish event
    await this.eventBus.publish('order.created', {
      orderId: order.id,
      userId: dto.userId,
      total: order.total,
    });

    return order;
  }
}
```

### CQRS [P2]

```ts
// commands/create-order.command.ts
interface Command<T = void> {
  execute(): Promise<T>;
}

class CreateOrderCommand implements Command<Order> {
  constructor(private dto: CreateOrderDTO, private deps: OrderDeps) {}

  async execute(): Promise<Order> {
    // Write path: validation, business logic, persistence
    const order = await this.deps.orderRepo.create(this.dto);
    await this.deps.eventBus.publish('order.created', order);
    return order;
  }
}

// queries/get-order-summary.query.ts
interface Query<T> {
  execute(): Promise<T>;
}

class GetOrderSummaryQuery implements Query<OrderSummary> {
  constructor(private userId: string, private deps: QueryDeps) {}

  async execute(): Promise<OrderSummary> {
    // Read path: optimized read model, denormalized views
    return this.deps.readDb.query(
      'SELECT * FROM order_summaries WHERE user_id = $1',
      [this.userId]
    );
  }
}

// Dispatcher
class CommandBus {
  private handlers = new Map<string, (cmd: any) => Promise<any>>();

  register<T>(commandName: string, handler: (cmd: T) => Promise<any>) {
    this.handlers.set(commandName, handler);
  }

  async dispatch<T>(commandName: string, command: T): Promise<any> {
    const handler = this.handlers.get(commandName);
    if (!handler) throw new Error(`No handler for ${commandName}`);
    return handler(command);
  }
}
```

---

## 4. Microservices

### Service Template [P1]

```ts
// services/order-service/src/index.ts
import Fastify from 'fastify';
import { orderRoutes } from './routes/order.routes';
import { healthRoutes } from './routes/health.routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { setupTracing } from './observability/tracing';

const app = Fastify({ logger: true });

// Observability
setupTracing('order-service');

// Middleware
app.setErrorHandler(errorHandler);
app.addHook('onRequest', requestLogger);

// Routes
app.register(healthRoutes, { prefix: '/health' });
app.register(orderRoutes, { prefix: '/api/v1/orders' });

// Graceful shutdown
const signals = ['SIGTERM', 'SIGINT'];
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, shutting down`);
    await app.close();
    process.exit(0);
  });
}

app.listen({ port: 3001, host: '0.0.0.0' });
```

```
services/
  order-service/
    src/
      routes/
      middleware/
      services/
      repositories/
      events/
      observability/
      index.ts
    Dockerfile
    package.json
  user-service/
    ...
  shared/
    proto/            # Shared .proto files
    events/           # Shared event schemas
```

### gRPC Communication [P2]

```proto
// proto/order.proto
syntax = "proto3";
package order;

service OrderService {
  rpc GetOrder (GetOrderRequest) returns (OrderResponse);
  rpc CreateOrder (CreateOrderRequest) returns (OrderResponse);
  rpc ListOrders (ListOrdersRequest) returns (ListOrdersResponse);
}

message GetOrderRequest {
  string order_id = 1;
}

message OrderResponse {
  string id = 1;
  string user_id = 2;
  repeated OrderItem items = 3;
  double total = 4;
  string status = 5;
}

message OrderItem {
  string product_id = 1;
  int32 quantity = 2;
  double price = 3;
}
```

```ts
// Server
import { Server, ServerCredentials, loadPackageDefinition } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';

const packageDef = loadSync('proto/order.proto');
const proto = loadPackageDefinition(packageDef) as any;

const server = new Server();
server.addService(proto.order.OrderService.service, {
  getOrder: async (call, callback) => {
    const order = await orderService.findById(call.request.order_id);
    callback(null, order);
  },
  createOrder: async (call, callback) => {
    const order = await orderService.create(call.request);
    callback(null, order);
  },
});

server.bindAsync('0.0.0.0:50051', ServerCredentials.createInsecure(), () => {
  console.log('gRPC server running on port 50051');
});
```

```bash
npm install @grpc/grpc-js @grpc/proto-loader
```

### Message Queue (BullMQ) [P2]

```ts
// producer.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis({ host: 'localhost', port: 6379, maxRetriesPerRequest: null });
const orderQueue = new Queue('orders', { connection });

await orderQueue.add('process-order', {
  orderId: '123',
  userId: 'user-456',
  items: [{ productId: 'prod-1', quantity: 2 }],
}, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 1000 },
  removeOnComplete: 1000,
  removeOnFail: 5000,
});

// consumer.ts
import { Worker } from 'bullmq';

const worker = new Worker('orders', async (job) => {
  console.log(`Processing ${job.name} - ${job.id}`);
  const { orderId, userId, items } = job.data;
  await processOrder(orderId, userId, items);
}, {
  connection,
  concurrency: 5,
  limiter: { max: 100, duration: 1000 }, // Rate limit: 100/sec
});

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed: ${err.message}`));
```

```bash
npm install bullmq ioredis
```

---

## 5. Serverless

### Lambda Function [P1]

```ts
// handler.ts
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const { httpMethod, pathParameters, body } = event;

  try {
    switch (httpMethod) {
      case 'GET':
        const id = pathParameters?.id;
        const item = await getItem(id);
        return { statusCode: 200, body: JSON.stringify(item) };

      case 'POST':
        const data = JSON.parse(body || '{}');
        const created = await createItem(data);
        return { statusCode: 201, body: JSON.stringify(created) };

      default:
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};
```

### Cloudflare Worker [P1]

```ts
// src/index.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/items' && request.method === 'GET') {
      const items = await env.DB.prepare('SELECT * FROM items LIMIT 50').all();
      return Response.json(items.results);
    }

    if (url.pathname === '/api/items' && request.method === 'POST') {
      const body = await request.json<{ name: string }>();
      const result = await env.DB.prepare('INSERT INTO items (name) VALUES (?)')
        .bind(body.name)
        .run();
      return Response.json({ id: result.meta.last_row_id }, { status: 201 });
    }

    return new Response('Not Found', { status: 404 });
  },
};

interface Env {
  DB: D1Database;
  KV: KVNamespace;
}
```

```bash
npm create cloudflare@latest my-worker -- --template hello-world
cd my-worker && npx wrangler dev   # Local dev
npx wrangler deploy                 # Deploy to edge
```

### Vercel Edge Function [P1]

```ts
// app/api/items/route.ts (Next.js App Router)
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  const results = await fetchFromDB(query);
  return Response.json(results);
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = await createInDB(body);
  return Response.json(created, { status: 201 });
}
```

---

## 6. Event-Driven

### Event Bus [P1]

```ts
// events/event-bus.ts
type EventHandler<T = any> = (payload: T) => Promise<void>;

class EventBus {
  private handlers = new Map<string, EventHandler[]>();

  on<T>(event: string, handler: EventHandler<T>) {
    const existing = this.handlers.get(event) || [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  async publish<T>(event: string, payload: T) {
    const handlers = this.handlers.get(event) || [];
    await Promise.allSettled(handlers.map((h) => h(payload)));
  }

  off(event: string, handler: EventHandler) {
    const existing = this.handlers.get(event) || [];
    this.handlers.set(event, existing.filter((h) => h !== handler));
  }
}

// Usage
const bus = new EventBus();

bus.on('order.created', async (order: Order) => {
  await sendConfirmationEmail(order);
});

bus.on('order.created', async (order: Order) => {
  await updateInventory(order.items);
});

await bus.publish('order.created', newOrder);
```

### Saga Orchestrator [P2]

```ts
// sagas/order-saga.ts
interface SagaStep<T> {
  name: string;
  execute(context: T): Promise<void>;
  compensate(context: T): Promise<void>;
}

class SagaOrchestrator<T> {
  private steps: SagaStep<T>[] = [];
  private executed: SagaStep<T>[] = [];

  addStep(step: SagaStep<T>) {
    this.steps.push(step);
    return this;
  }

  async run(context: T): Promise<void> {
    for (const step of this.steps) {
      try {
        await step.execute(context);
        this.executed.push(step);
      } catch (error) {
        console.error(`Step "${step.name}" failed, compensating...`);
        await this.compensate(context);
        throw error;
      }
    }
  }

  private async compensate(context: T) {
    for (const step of this.executed.reverse()) {
      try {
        await step.compensate(context);
      } catch (err) {
        console.error(`Compensation for "${step.name}" failed: ${err}`);
      }
    }
  }
}

// Usage: Order placement saga
const orderSaga = new SagaOrchestrator<OrderContext>();

orderSaga
  .addStep({
    name: 'reserve-inventory',
    execute: async (ctx) => { ctx.reservation = await inventoryService.reserve(ctx.items); },
    compensate: async (ctx) => { await inventoryService.release(ctx.reservation); },
  })
  .addStep({
    name: 'process-payment',
    execute: async (ctx) => { ctx.payment = await paymentService.charge(ctx.total); },
    compensate: async (ctx) => { await paymentService.refund(ctx.payment); },
  })
  .addStep({
    name: 'create-order',
    execute: async (ctx) => { ctx.order = await orderService.create(ctx); },
    compensate: async (ctx) => { await orderService.cancel(ctx.order.id); },
  });

await orderSaga.run({ items, total, userId });
```

### Outbox Pattern [P2]

```ts
// outbox/outbox.service.ts
class OutboxService {
  constructor(private db: Database) {}

  // Write entity + outbox event in same transaction
  async createWithEvent<T>(
    tableName: string,
    entity: T,
    event: { type: string; payload: any }
  ) {
    return this.db.transaction(async (tx) => {
      const created = await tx.insert(tableName, entity);

      await tx.insert('outbox', {
        id: crypto.randomUUID(),
        event_type: event.type,
        payload: JSON.stringify(event.payload),
        created_at: new Date(),
        published: false,
      });

      return created;
    });
  }
}

// outbox/outbox.poller.ts
class OutboxPoller {
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private db: Database,
    private eventBus: EventBus,
    private pollIntervalMs = 1000
  ) {}

  start() {
    this.interval = setInterval(() => this.poll(), this.pollIntervalMs);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  private async poll() {
    const events = await this.db.query(
      'SELECT * FROM outbox WHERE published = false ORDER BY created_at LIMIT 100'
    );

    for (const event of events) {
      try {
        await this.eventBus.publish(event.event_type, JSON.parse(event.payload));
        await this.db.update('outbox', event.id, { published: true });
      } catch (err) {
        console.error(`Failed to publish outbox event ${event.id}: ${err}`);
      }
    }
  }
}
```

```sql
-- Outbox table schema
CREATE TABLE outbox (
  id UUID PRIMARY KEY,
  event_type VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP
);

CREATE INDEX idx_outbox_unpublished ON outbox (created_at) WHERE published = FALSE;
```

---

## 7. Resilience

### Circuit Breaker [P1]

```ts
import { CircuitBreakerPolicy, ConsecutiveBreaker, handleAll } from 'cockatiel';

const circuitBreaker = new CircuitBreakerPolicy(handleAll, {
  halfOpenAfter: 10_000,                    // Try again after 10s
  breaker: new ConsecutiveBreaker(5),       // Open after 5 consecutive failures
});

circuitBreaker.onBreak(() => console.warn('Circuit OPEN - requests blocked'));
circuitBreaker.onHalfOpen(() => console.info('Circuit HALF-OPEN - testing'));
circuitBreaker.onReset(() => console.info('Circuit CLOSED - recovered'));

const result = await circuitBreaker.execute(() => callExternalService());
```

### Retry Policy [P1]

```ts
import { retry, handleAll, ExponentialBackoff } from 'cockatiel';

const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff({
    initialDelay: 200,      // 200ms, 400ms, 800ms
    maxDelay: 10_000,       // Cap at 10s
    exponent: 2,
  }),
});

retryPolicy.onRetry(({ attempt }) => console.warn(`Retry attempt ${attempt}`));
retryPolicy.onGiveUp(() => console.error('All retries exhausted'));

const result = await retryPolicy.execute(() => fetch('/api/data'));
```

### Bulkhead [P2]

```ts
import { BulkheadPolicy } from 'cockatiel';

// Limit concurrent calls to external service
const bulkhead = new BulkheadPolicy(10, 50);  // 10 concurrent, 50 queued

bulkhead.onReject(() => console.warn('Bulkhead rejected - too many concurrent requests'));

const result = await bulkhead.execute(() => callPaymentGateway());
```

### Composed Policy [P2]

```ts
import {
  CircuitBreakerPolicy,
  ConsecutiveBreaker,
  ExponentialBackoff,
  retry,
  timeout,
  wrap,
  handleAll,
  TimeoutStrategy,
} from 'cockatiel';

// Individual policies
const timeoutPolicy = timeout(5_000, TimeoutStrategy.Cooperative);

const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff(),
});

const circuitBreaker = new CircuitBreakerPolicy(handleAll, {
  halfOpenAfter: 30_000,
  breaker: new ConsecutiveBreaker(5),
});

// Compose: timeout -> retry -> circuit breaker
// Read right-to-left: circuit breaker wraps retry, which wraps timeout
const policy = wrap(circuitBreaker, retryPolicy, timeoutPolicy);

// Use everywhere
const data = await policy.execute(async ({ signal }) => {
  const res = await fetch('/api/data', { signal });
  return res.json();
});
```

---

## 8. Configuration

### Feature Flags with OpenFeature [P1]

```ts
// flags/setup.ts
import { OpenFeature } from '@openfeature/server-sdk';
import { UnleashProvider } from '@openfeature/unleash-provider'; // Or any provider

// Set provider once at startup
await OpenFeature.setProviderAndWait(
  new UnleashProvider({
    url: process.env.UNLEASH_URL!,
    apiKey: process.env.UNLEASH_API_KEY!,
    appName: 'my-app',
  })
);

const client = OpenFeature.getClient();

// flags/use-flag.ts
export async function isFeatureEnabled(flag: string, context?: EvaluationContext): Promise<boolean> {
  return client.getBooleanValue(flag, false, context);
}

// Usage
if (await isFeatureEnabled('new-checkout-flow', { targetingKey: userId })) {
  // New flow
} else {
  // Old flow
}
```

```bash
npm install @openfeature/server-sdk
# Choose a provider:
npm install @openfeature/unleash-provider   # Unleash
npm install @openfeature/flagd-provider     # flagd (lightweight)
```

### Environment Management [P0]

```ts
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
```

```
.env.example          # Checked in: documents all variables (no values)
.env.development      # Local dev defaults (gitignored)
.env.test             # Test overrides (gitignored)
.env.production       # Production (gitignored, managed by CI/CD)
```

---

## Quick Reference: Build Priority

| Priority | Patterns | When |
|---|---|---|
| **P0** | Monorepo config, project structure, barrel rules, env management | Day 0 |
| **P1** | Repository, service layer, event bus, circuit breaker, retry, feature flags, service template, serverless functions | Initial build |
| **P2** | CQRS, saga, outbox, bulkhead, gRPC, message queues, composed policies | Scaling phase |
| **P3** | Event sourcing, distributed tracing tuning, advanced caching | Production optimization |
