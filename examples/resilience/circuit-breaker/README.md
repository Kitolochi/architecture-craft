# Circuit Breaker + Retry with Cockatiel

Production-ready resilience policies using [Cockatiel](https://github.com/connor4312/cockatiel): circuit breaker, retry with exponential backoff, timeout, and composed policies.

## Policies

### Circuit Breaker (`circuit-breaker.ts`)

Stops calling a failing service after consecutive failures. Prevents cascading failures.

- **Consecutive breaker**: Opens after N consecutive failures
- **Sampling breaker**: Opens when failure rate exceeds threshold over a time window

```ts
import { createCircuitBreaker } from './policies/circuit-breaker';

const breaker = createCircuitBreaker({
  consecutiveFailures: 5,  // Open after 5 failures
  halfOpenAfterMs: 10_000, // Try again after 10s
});

const result = await breaker.execute(() => callExternalService());
```

### Retry (`retry.ts`)

Retries failed calls with configurable backoff strategies.

- **Exponential backoff**: 200ms, 400ms, 800ms... (capped at max delay)
- **Constant backoff**: Fixed delay between attempts
- **Selective retry**: Only retry specific error types

```ts
import { createExponentialRetry } from './policies/retry';

const retrier = createExponentialRetry({
  maxAttempts: 3,
  initialDelayMs: 200,
  maxDelayMs: 10_000,
});

const result = await retrier.execute(() => fetch('/api/data'));
```

### Composed Policy (`composed.ts`)

Combines timeout, retry, and circuit breaker into a single policy using `wrap()`.

**Execution order** (read right-to-left in `wrap()`):
1. **Timeout** -- Abort individual calls that take too long
2. **Retry** -- Retry failed/timed-out calls with exponential backoff
3. **Circuit breaker** -- Stop calling entirely after repeated failures

```ts
import { createResilientPolicy } from './policies/composed';

const policy = createResilientPolicy({
  timeoutMs: 5_000,
  maxRetries: 3,
  consecutiveFailures: 5,
  halfOpenAfterMs: 30_000,
});

const data = await policy.execute(async ({ signal }) => {
  const res = await fetch('/api/data', { signal });
  return res.json();
});
```

## When to Use

- **Circuit breaker alone**: Database connections, service-to-service calls
- **Retry alone**: Transient errors (network blips, 503s)
- **Composed policy**: External API calls, payment gateways, any critical integration

## Dependencies

```bash
npm install cockatiel
```
