import {
  bulkhead,
  circuitBreaker,
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleAll,
  retry,
  timeout,
  TimeoutStrategy,
  wrap,
} from "cockatiel";

interface ResilientClientOptions {
  timeout: number;
  retry: { maxAttempts: number; initialDelay: number };
  circuitBreaker: { threshold: number; halfOpenAfter: number };
  bulkhead: { maxConcurrent: number; maxQueue: number };
  fallback: (...args: any[]) => Promise<any>;
}

/**
 * Compose all resilience patterns in the correct order:
 *
 *   Request
 *     -> Bulkhead (limit concurrency)
 *       -> Circuit Breaker (fail fast if downstream is broken)
 *         -> Retry (with exponential backoff)
 *           -> Timeout (cancel slow calls)
 *             -> Actual call
 *
 * The outermost policy runs first. Timeout is innermost because each
 * retry attempt should have its own deadline.
 */
export function createResilientClient(options: ResilientClientOptions) {
  let totalRequests = 0;
  let successCount = 0;
  let failureCount = 0;
  let fallbackCount = 0;
  let timeoutCount = 0;
  let circuitOpenCount = 0;
  let bulkheadRejectCount = 0;

  // Innermost: timeout per attempt
  const timeoutPolicy = timeout(options.timeout, TimeoutStrategy.Cooperative);
  timeoutPolicy.onTimeout(() => timeoutCount++);

  // Retry with exponential backoff
  const retryPolicy = retry(handleAll, {
    maxAttempts: options.retry.maxAttempts,
    backoff: new ExponentialBackoff({
      initialDelay: options.retry.initialDelay,
    }),
  });

  // Circuit breaker — fail fast after consecutive failures
  const breakerPolicy = circuitBreaker(handleAll, {
    breaker: new ConsecutiveBreaker(options.circuitBreaker.threshold),
    halfOpenAfter: options.circuitBreaker.halfOpenAfter,
  });
  breakerPolicy.onBreak(() => {
    circuitOpenCount++;
    console.warn("[circuit-breaker] OPEN — failing fast");
  });
  breakerPolicy.onReset(() => {
    console.log("[circuit-breaker] CLOSED — recovered");
  });

  // Outermost: bulkhead
  const bulkheadPolicy = bulkhead(
    options.bulkhead.maxConcurrent,
    options.bulkhead.maxQueue
  );
  bulkheadPolicy.onReject(() => bulkheadRejectCount++);

  // Compose: bulkhead -> breaker -> retry -> timeout
  const composed = wrap(bulkheadPolicy, breakerPolicy, retryPolicy, timeoutPolicy);

  return {
    async execute<T>(
      arg: string,
      fn: (arg: string, signal?: AbortSignal) => Promise<T>
    ): Promise<T> {
      totalRequests++;
      try {
        const result = await composed.execute(({ signal }) => fn(arg, signal));
        successCount++;
        return result;
      } catch (err) {
        failureCount++;
        // Try fallback
        try {
          const fallbackResult = await options.fallback(arg);
          fallbackCount++;
          return fallbackResult as T;
        } catch {
          throw err; // Fallback also failed
        }
      }
    },

    stats() {
      return {
        totalRequests,
        successCount,
        failureCount,
        fallbackCount,
        timeoutCount,
        circuitOpenCount,
        bulkheadRejectCount,
        circuitState: breakerPolicy.state,
      };
    },
  };
}
