# architecture-craft

Reference catalog of architecture patterns, tools, and decision frameworks for modern TypeScript/JavaScript systems.

## Structure

```
catalog/
  ARCHITECTURE_TOOLKIT.md   # Decision matrices, tool comparisons, install commands
  PATTERN_CATALOG.md        # Implementable code patterns with build priority tiers
examples/                   # (Future) Runnable example projects
```

## What's Covered

- **Monorepo**: Turborepo, Nx, pnpm workspaces, Moon
- **Project Structure**: Feature-based layout, barrel export rules, dependency injection
- **Design Patterns**: Repository, service layer, CQRS, event sourcing, mediator, strategy
- **Microservices**: Service templates, gRPC, message queues (BullMQ)
- **Serverless**: Lambda, Cloudflare Workers, Vercel Edge Functions
- **Event-Driven**: Event bus, saga (choreography/orchestration), outbox pattern
- **Resilience**: Circuit breaker, retry, bulkhead, composed policies (Cockatiel)
- **Configuration**: Feature flags (OpenFeature), environment validation (Zod)
- **Observability**: OpenTelemetry, Pino, Sentry

## Tech Referenced

TypeScript, Node.js, Fastify, Prisma, gRPC, BullMQ, Redis, Cockatiel, OpenFeature, Zod, Turborepo, Nx, pnpm, Cloudflare Workers, AWS Lambda, Next.js, Astro, SvelteKit.
