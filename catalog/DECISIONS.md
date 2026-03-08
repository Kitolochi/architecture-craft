# Architecture Decision Frameworks

Opinionated guides for common architecture choices. Each section gives a default, explains when to deviate, and provides a comparison table.

---

## Monorepo Tools: Turborepo vs Nx vs Moon

**Default choice:** Turborepo — simplest setup, excellent caching, zero config for most projects.

**Choose Turborepo when:** You want fast builds with minimal config, your monorepo has < 50 packages, or you're already using Vercel.

**Choose Nx when:** You need advanced dependency graph analysis, affected-only testing, code generators, or have 50+ packages with complex interdependencies.

**Choose Moon when:** You have a polyglot monorepo (Rust + TypeScript + Go), need language-agnostic task orchestration, or want Rust-speed tooling.

| Factor | Turborepo | Nx | Moon |
|--------|-----------|-----|------|
| Setup complexity | Minimal | Medium | Medium |
| Config format | turbo.json | nx.json + project.json | .moon/*.yml |
| Caching | Local + Remote (Vercel) | Local + Nx Cloud | Local + Remote |
| Task orchestration | Parallel by default | Parallel + affected | Parallel + affected |
| Code generators | No | Yes (extensive) | Yes (templates) |
| Language support | JS/TS only | JS/TS (+ plugins) | Any language |
| Plugin ecosystem | Small | Large | Small |
| Incremental adoption | Easy | Medium | Medium |
| Build speed | Fast | Fast | Fastest (Rust) |

**Our pick:** Turborepo for TypeScript monorepos. Nx when you outgrow it or need code generation. Moon for polyglot.

---

## Architecture: Modular Monolith vs Microservices

**Default choice:** Modular Monolith — deploy as one unit, enforce module boundaries, extract later.

**Choose Modular Monolith when:** You're a small team (< 10 devs), your domain boundaries aren't clear yet, you want simple deployment, or you're building an MVP.

**Choose Microservices when:** You have 3+ teams that need independent deploy cadences, your domains are well-understood and stable, or specific services have radically different scaling needs.

**The hybrid path:**
1. Start with a modular monolith with clear module boundaries
2. Enforce boundaries through module APIs (not direct DB access)
3. Extract to microservices only when you have a clear scaling or team reason
4. Each extraction should solve a specific, measurable problem

| Factor | Modular Monolith | Microservices |
|--------|------------------|---------------|
| Deployment | Single unit | Per-service |
| Latency | In-process calls | Network calls |
| Data consistency | Transactions | Eventual consistency |
| Debugging | Stack traces | Distributed tracing |
| Team autonomy | Shared codebase | Independent repos |
| Operational complexity | Low | High |
| Refactoring | Easy (same process) | Hard (API contracts) |
| Scaling | Vertical + horizontal clones | Per-service horizontal |

**Our pick:** Modular monolith until you feel real pain. The monolith-to-microservice extraction is easier than microservice-to-monolith consolidation.

---

## Resilience Composition: Layering Order Guide

**Default composition (outermost to innermost):**

```
Request → Bulkhead → Circuit Breaker → Retry → Timeout → Call
```

**Why this order matters:**

1. **Bulkhead (outermost):** Limits total concurrency before any work happens. Prevents resource exhaustion.
2. **Circuit Breaker:** Fails fast if the downstream is known-broken. No point retrying a dead service.
3. **Retry:** Retries transient failures with backoff. Each retry goes through the timeout.
4. **Timeout (innermost):** Each individual attempt has its own deadline. Prevents retry from waiting forever.

**Common mistakes:**
- Timeout outside retry → one timeout for all attempts (usually too tight or too loose)
- No bulkhead → thundering herd on recovery
- Retry outside circuit breaker → retries trigger breaker faster than necessary
- Missing fallback → all-or-nothing (add fallback as a catch after the composed policy)

**When to simplify:**
- Internal calls between colocated services: timeout only
- Idempotent reads: retry + timeout (no breaker needed)
- Critical writes: timeout + circuit breaker (no retry — let the client decide)

---

## Feature Flags: OpenFeature as Architecture

**Default choice:** OpenFeature SDK — vendor-neutral feature flag protocol.

**Why OpenFeature over direct SDK integration:**
- Switch providers without code changes (LaunchDarkly → Unleash → homegrown)
- Consistent API across your entire codebase
- Type-safe evaluation with structured context
- Community-maintained providers for every major platform

**Provider comparison:**

| Factor | LaunchDarkly | Unleash | Flagsmith | DevCycle | Homegrown |
|--------|-------------|---------|-----------|----------|-----------|
| Pricing | Per seat ($$$) | OSS + Pro | OSS + Pro | Per MAU | Free |
| Self-hostable | No | Yes | Yes | No | Yes |
| Real-time updates | Yes | Webhook/poll | Webhook/poll | Yes | You build it |
| Targeting rules | Advanced | Good | Good | Good | Basic |
| A/B testing | Built-in | Plugin | Built-in | Built-in | You build it |
| OpenFeature provider | Official | Official | Community | Official | You build it |

**Our pick:** Start with a simple in-memory/config-file provider behind OpenFeature. Upgrade to Unleash or LaunchDarkly when you need targeting rules or A/B testing.
