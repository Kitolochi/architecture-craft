# Architecture Toolkit

Reference catalog of tools, patterns, and architectural decisions for modern TypeScript/JavaScript systems.

---

## Monorepo Tools

### Decision Matrix

| Criteria | Turborepo | Nx | pnpm Workspaces | Moon |
|---|---|---|---|---|
| **Setup complexity** | Minimal | Moderate | Minimal | Moderate |
| **Build speed (large)** | Fast | ~7x faster than Turbo | Manual | Fast (Rust-based) |
| **Task orchestration** | Pipeline-based | Task graph + affected | Scripts only | Task graph |
| **Caching** | Local + remote (Vercel) | Local + remote (Nx Cloud) | None built-in | Local + remote |
| **Code generation** | None | Generators + plugins | None | Templates |
| **Dependency graph** | Inferred from package.json | Deep analysis + plugins | Package-level only | Project-level |
| **Language support** | JS/TS only | JS/TS + Go, Rust, etc. | JS/TS only | Polyglot (Rust core) |
| **IDE integration** | Basic | Nx Console (VSCode, JetBrains) | None | Basic |
| **Best for** | Small-medium teams, simplicity | Large orgs, enterprise | Minimal tooling needs | Polyglot, Rust enthusiasts |

### Quick Start

```bash
# Turborepo
npx create-turbo@latest my-monorepo

# Nx
npx create-nx-workspace@latest my-workspace

# pnpm workspaces
pnpm init && mkdir packages apps
# Add pnpm-workspace.yaml with packages: ['packages/*', 'apps/*']

# Moon
npm install -g @moonrepo/cli && moon init
```

### When to Choose

- **Turborepo**: You want zero-config caching with minimal learning curve. Team < 20 devs.
- **Nx**: You need affected commands, code generation, deep dependency analysis. 50+ packages.
- **pnpm workspaces**: You want dependency management only, bring your own orchestration.
- **Moon**: Polyglot repo (Rust + TS + Go), need language-agnostic task runner.

---

## Project Structure

### Feature-Based vs Layer-Based

| Aspect | Feature-Based | Layer-Based |
|---|---|---|
| **Organization** | Group by domain feature | Group by technical layer |
| **Scalability** | Scales with features | Grows unwieldy past ~20 modules |
| **Coupling** | Low cross-feature coupling | High cross-layer coupling |
| **Onboarding** | Find feature, see all related code | Must navigate multiple directories |
| **Refactoring** | Move/delete entire feature folder | Scatter changes across layers |

**Verdict**: Feature-based wins for scalability. Layer-based acceptable for small apps (< 10 modules).

```
# Feature-based (recommended)
src/
  features/
    auth/
      components/
      hooks/
      api/
      store/
      auth.types.ts
    billing/
      components/
      hooks/
      api/
      store/
      billing.types.ts
  shared/
    components/
    hooks/
    utils/

# Layer-based (small apps only)
src/
  components/
  hooks/
  services/
  store/
  utils/
  types/
```

### Barrel Exports Debate

**The problem**: Barrel files (`index.ts` re-exporting everything) cause bundlers to import entire modules when only one export is needed.

**Key data**: Atlassian achieved **75% faster builds** by removing barrel files from their monorepo.

| Approach | Pros | Cons |
|---|---|---|
| **No barrels** | Fastest builds, tree-shaking works | Longer import paths |
| **Leaf barrels only** | Clean imports for small modules | Still some overhead |
| **Full barrels** | Short imports | Breaks tree-shaking, slow builds |

**Recommendation**: Use direct imports. Reserve barrels for genuinely public package APIs only.

```ts
// Avoid
import { Button } from '@/components';        // pulls entire barrel

// Prefer
import { Button } from '@/components/Button'; // direct import
```

### Dependency Injection

| Library | Size | Decorators Required | Key Feature |
|---|---|---|---|
| **TSyringe** | ~4KB | Yes (`reflect-metadata`) | Lightweight, Microsoft-backed |
| **InversifyJS** | ~11KB | Yes | Feature-rich, middleware support |
| **Awilix** | ~8KB | No | Auto-scanning, proxy-based |
| **typed-inject** | ~2KB | No | Compile-time safety, no decorators |

```bash
# TSyringe (lightweight, decorator-based)
npm install tsyringe reflect-metadata

# InversifyJS (feature-rich)
npm install inversify reflect-metadata

# Awilix (no decorators)
npm install awilix
```

---

## Design Patterns

### Repository Pattern

Abstracts data access behind a collection-like interface. Decouples domain logic from storage.

```ts
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(filter?: Partial<T>): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}
```

**When**: Any app with data persistence. Enables swapping databases, simplifies testing.

### Service Layer

Orchestrates business operations across repositories and external services.

```ts
class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private paymentGateway: PaymentGateway,
    private eventBus: EventBus
  ) {}

  async placeOrder(dto: CreateOrderDTO): Promise<Order> {
    const order = await this.orderRepo.create(dto);
    await this.paymentGateway.charge(order.total);
    await this.eventBus.publish('order.placed', order);
    return order;
  }
}
```

**When**: Business logic spans multiple concerns. Keeps controllers thin.

### CQRS (Command Query Responsibility Segregation)

Separate read and write models for different optimization strategies.

```
Commands (writes) -> Command Handler -> Write Model -> Event Store
Queries (reads)   -> Query Handler   -> Read Model  -> Optimized Views
```

**When**: Read/write patterns differ significantly, high-traffic reads, event sourcing.
**Skip when**: Simple CRUD, small teams, low complexity.

### Event Sourcing

Store state changes as immutable events instead of current state.

**When**: Audit trails required, temporal queries, undo/replay needed.
**Skip when**: Simple CRUD, no audit requirements. Adds significant complexity.

### Mediator Pattern

Decouple request senders from handlers via a central mediator.

```bash
npm install @mediatr-ts/core  # TypeScript MediatR port
```

**When**: Complex command/query pipelines, cross-cutting concerns (logging, validation, caching).

### Strategy Pattern

Swap algorithms at runtime behind a common interface.

```ts
interface PricingStrategy {
  calculate(base: number, context: PricingContext): number;
}

class DiscountPricing implements PricingStrategy { /* ... */ }
class PremiumPricing implements PricingStrategy { /* ... */ }
```

**When**: Multiple algorithms for the same operation, behavior varies by configuration or user type.

---

## Microservices

### When to Use

**Use microservices when**:
- Independent deployment cycles are critical
- Teams own distinct bounded contexts (> 3 teams)
- Services need different scaling profiles
- Technology diversity is needed per service

**Stay monolithic when**:
- Team < 10 devs
- Domain boundaries are unclear
- You're building an MVP
- Operational maturity is low (no CI/CD, no observability)

### Communication Protocols

| Protocol | Latency | Payload | Schema | Best For |
|---|---|---|---|---|
| **REST/HTTP** | Moderate | JSON (text) | OpenAPI | Public APIs, CRUD |
| **gRPC** | Low (210-298% faster than REST) | Protobuf (binary) | .proto files | Internal service-to-service |
| **Message Queues** | Async | Any | Schema registry | Decoupled, event-driven |
| **GraphQL** | Moderate | JSON | Schema + types | Flexible client queries |

```bash
# gRPC for Node.js
npm install @grpc/grpc-js @grpc/proto-loader

# Message queues
npm install bullmq ioredis   # Redis-backed
npm install amqplib           # RabbitMQ
```

### Service Discovery

| Approach | Examples | Complexity |
|---|---|---|
| **DNS-based** | Kubernetes DNS, Consul DNS | Low |
| **Registry-based** | Consul, Eureka, etcd | Medium |
| **Mesh-based** | Istio, Linkerd | High |
| **Cloud-native** | AWS Cloud Map, GCP Service Directory | Low-Medium |

---

## Serverless

### Platform Comparison

| Criteria | AWS Lambda | Cloudflare Workers | Vercel Edge Functions | Deno Deploy |
|---|---|---|---|---|
| **Cold start** | 100ms-1s+ | ~0ms | ~0ms | ~0ms |
| **Max execution** | 15 min | 30s (free), 15 min (paid) | 25s | Unlimited |
| **Runtime** | Node, Python, Go, etc. | V8 isolates | V8 isolates | Deno (V8) |
| **Max bundle** | 250MB (zipped 50MB) | 10MB | 4MB | No hard limit |
| **Node.js APIs** | Full | Partial (no `fs`, `net`) | Partial | Deno-native + npm compat |
| **Pricing model** | Per invocation + duration | Per request (generous free tier) | Per invocation | Per request |
| **Regions** | Choose region | 300+ edge locations | Edge network | 35+ regions |
| **DB access** | VPC or public endpoint | D1, KV, R2 (Cloudflare native) | KV, Postgres | Deno KV |

**Key finding**: Cloudflare Workers are **210-298% faster** than Lambda due to V8 isolate architecture (no container cold starts).

### Limitations to Watch

- **Lambda**: Cold starts degrade P99 latency; provisioned concurrency costs extra.
- **Workers**: No native TCP sockets, limited Node.js API surface, 128MB memory.
- **Edge Functions**: Small bundle limits, no long-running processes.

---

## Full-Stack Frameworks

### Rendering Strategy Comparison

| Framework | SSR | SSG | ISR | Streaming | Islands | Partial Hydration |
|---|---|---|---|---|---|---|
| **Next.js** | Yes | Yes | Yes | Yes (App Router) | No | Partial (RSC) |
| **Nuxt** | Yes | Yes | Yes (SWR) | Yes | No | No |
| **SvelteKit** | Yes | Yes | No native | Yes | No | No |
| **Remix** | Yes | No native | No | Yes | No | No |
| **Astro** | Yes | Yes | No | No | Yes | Yes |

### Performance Benchmarks

| Metric | Next.js (App Router) | SvelteKit | Astro | Nuxt |
|---|---|---|---|---|
| **JS shipped (typical)** | Baseline | ~50% less than Next | Minimal (islands) | ~Similar to Next |
| **LCP (content sites)** | Baseline | Faster | 40-70% better | Similar |
| **TTI** | Moderate | Fast | Fastest (< 500ms) | Moderate |
| **Build speed** | Moderate | Fast | Fast | Moderate |

### When to Choose

- **Next.js**: Full-stack React, complex data fetching, Vercel deployment, largest ecosystem.
- **Nuxt**: Vue ecosystem, similar capabilities to Next.js for Vue teams.
- **SvelteKit**: Performance-critical apps, smaller bundles, simpler mental model.
- **Remix**: Form-heavy apps, progressive enhancement, web standards focus.
- **Astro**: Content-heavy sites (docs, blogs, marketing), minimal JS, multi-framework islands.

---

## API Gateways

| Gateway | Type | Key Strength | Pricing |
|---|---|---|---|
| **Kong** | Self-hosted / Cloud | Plugin ecosystem, Lua extensible | Open source + enterprise |
| **AWS API Gateway** | Managed | Lambda integration, IAM auth | Per request |
| **Traefik** | Self-hosted | Auto-discovery, Docker/K8s native | Open source + enterprise |
| **Express Gateway** | Self-hosted | Node.js native, simple | Open source |
| **Custom (Fastify/Express)** | Self-built | Full control | Development time |

**Recommendation**: Use managed (AWS API Gateway) for serverless. Kong or Traefik for Kubernetes. Custom only when gateway logic is a core differentiator.

---

## Event-Driven Architecture

### Event Bus

Central publish/subscribe system for decoupled communication.

```bash
# In-process
npm install eventemitter3      # Lightweight EventEmitter
npm install mitt               # Tiny (200B) event emitter

# Distributed
npm install bullmq ioredis     # Redis Streams
npm install kafkajs             # Apache Kafka
npm install @google-cloud/pubsub
```

### Saga Pattern

Manages distributed transactions across services.

| Type | Coordination | Coupling | Complexity | Best For |
|---|---|---|---|---|
| **Choreography** | Events between services | Low | Low (few steps) | 2-4 services, simple flows |
| **Orchestration** | Central coordinator | Medium | Managed centrally | 5+ services, complex flows |

**Rule of thumb**: Start with choreography. Switch to orchestration when the event chain exceeds 4 steps or requires compensating transactions.

### Outbox Pattern

Solves the **dual-write problem** (writing to DB + publishing event atomically).

```
1. Write entity + event to same DB transaction (outbox table)
2. Separate process polls outbox table, publishes to message broker
3. Mark outbox entry as published
```

**When**: Any system where DB writes must reliably trigger downstream events.

---

## Feature Flags

| Platform | Type | Key Feature | Pricing |
|---|---|---|---|
| **LaunchDarkly** | SaaS | Enterprise targeting, SDKs for everything | Per seat (expensive) |
| **Unleash** | Self-hosted / Cloud | Open source, simple | Free (self-hosted) |
| **Flagsmith** | Self-hosted / Cloud | Open source, remote config | Free tier |
| **OpenFeature** | Standard/SDK | Vendor-agnostic CNCF standard | Free (specification) |
| **ConfigCat** | SaaS | Simple, generous free tier | Per config request |

```bash
# OpenFeature (vendor-agnostic, CNCF standard)
npm install @openfeature/server-sdk
npm install @openfeature/web-sdk          # Browser

# Unleash (self-hosted)
npm install unleash-client

# Flagsmith
npm install flagsmith
```

**Recommendation**: Use **OpenFeature SDK** as the abstraction layer, swap providers without code changes. Start with Unleash or Flagsmith for self-hosted, LaunchDarkly for enterprise SaaS.

---

## Resilience Patterns

### Pattern Overview

| Pattern | Purpose | When to Use |
|---|---|---|
| **Circuit Breaker** | Stop calling failing services | External API calls, downstream services |
| **Retry with Backoff** | Recover from transient failures | Network requests, queue processing |
| **Bulkhead** | Isolate failures, prevent cascade | Multiple downstream dependencies |
| **Timeout** | Bound response time | Any external call |
| **Fallback** | Degrade gracefully | Non-critical features |

### Libraries

| Library | Patterns | API Style | Size |
|---|---|---|---|
| **Cockatiel** | All (circuit breaker, retry, bulkhead, timeout, fallback) | Fluent, composable | ~15KB |
| **Opossum** | Circuit breaker only | Event-based | ~8KB |
| **p-retry** | Retry only | Promise-based | ~2KB |
| **p-timeout** | Timeout only | Promise-based | ~1KB |

```bash
# Cockatiel (recommended - all patterns, TypeScript-first, fluent API)
npm install cockatiel

# Opossum (circuit breaker focused)
npm install opossum
```

### Cockatiel Example

```ts
import {
  CircuitBreakerPolicy,
  ConsecutiveBreaker,
  ExponentialBackoff,
  retry,
  handleAll,
  wrap
} from 'cockatiel';

const retryPolicy = retry(handleAll, {
  maxAttempts: 3,
  backoff: new ExponentialBackoff()
});

const circuitBreaker = new CircuitBreakerPolicy(handleAll, {
  halfOpenAfter: 10_000,
  breaker: new ConsecutiveBreaker(5)
});

// Compose policies (retry wraps circuit breaker)
const policy = wrap(retryPolicy, circuitBreaker);

const result = await policy.execute(() => fetch('/api/data'));
```

---

## Cross-Cutting: Observability Stack

| Layer | Tool | Purpose |
|---|---|---|
| **Tracing** | OpenTelemetry | Distributed tracing standard |
| **Metrics** | Prometheus + Grafana | Metrics collection + dashboards |
| **Logging** | Pino / Winston | Structured logging |
| **Error tracking** | Sentry | Error aggregation + alerting |

```bash
# OpenTelemetry (tracing)
npm install @opentelemetry/api @opentelemetry/sdk-node

# Pino (fastest Node.js logger)
npm install pino pino-pretty

# Sentry
npm install @sentry/node
```
