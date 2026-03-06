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

// Composed policy: timeout -> retry -> circuit breaker
// Read right-to-left: circuit breaker wraps retry, which wraps timeout.
// - If a single call exceeds the timeout, it fails
// - The retry policy retries failed/timed-out calls
// - If too many retries fail, the circuit breaker opens to stop hammering
export function createResilientPolicy(options?: {
  timeoutMs?: number;
  maxRetries?: number;
  initialRetryDelayMs?: number;
  consecutiveFailures?: number;
  halfOpenAfterMs?: number;
}) {
  const {
    timeoutMs = 5_000,
    maxRetries = 3,
    initialRetryDelayMs = 200,
    consecutiveFailures = 5,
    halfOpenAfterMs = 30_000,
  } = options ?? {};

  // Timeout: abort individual calls after N ms
  const timeoutPolicy = timeout(timeoutMs, TimeoutStrategy.Cooperative);

  timeoutPolicy.onTimeout(() => {
    console.warn(`[Timeout] Request exceeded ${timeoutMs}ms`);
  });

  // Retry: retry failed calls with exponential backoff
  const retryPolicy = retry(handleAll, {
    maxAttempts: maxRetries,
    backoff: new ExponentialBackoff({
      initialDelay: initialRetryDelayMs,
      maxDelay: 10_000,
      exponent: 2,
    }),
  });

  retryPolicy.onRetry(({ attempt }) => {
    console.warn(`[Retry] Attempt ${attempt} of ${maxRetries}`);
  });

  retryPolicy.onGiveUp(() => {
    console.error(`[Retry] All ${maxRetries} attempts exhausted`);
  });

  // Circuit breaker: stop calling after repeated failures
  const circuitBreaker = new CircuitBreakerPolicy(handleAll, {
    halfOpenAfter: halfOpenAfterMs,
    breaker: new ConsecutiveBreaker(consecutiveFailures),
  });

  circuitBreaker.onBreak(() => {
    console.warn('[CircuitBreaker] OPEN -- fast-failing all requests');
  });

  circuitBreaker.onReset(() => {
    console.info('[CircuitBreaker] CLOSED -- recovered');
  });

  // Compose: outermost policy runs first
  // circuit breaker -> retry -> timeout
  const policy = wrap(circuitBreaker, retryPolicy, timeoutPolicy);

  return policy;
}
