import {
  CircuitBreakerPolicy,
  ConsecutiveBreaker,
  handleAll,
  SamplingBreaker,
} from 'cockatiel';

// Simple circuit breaker: opens after 5 consecutive failures, retries after 10s
export function createCircuitBreaker(options?: {
  consecutiveFailures?: number;
  halfOpenAfterMs?: number;
}) {
  const {
    consecutiveFailures = 5,
    halfOpenAfterMs = 10_000,
  } = options ?? {};

  const circuitBreaker = new CircuitBreakerPolicy(handleAll, {
    halfOpenAfter: halfOpenAfterMs,
    breaker: new ConsecutiveBreaker(consecutiveFailures),
  });

  circuitBreaker.onBreak(() => {
    console.warn('[CircuitBreaker] OPEN -- requests will be rejected');
  });

  circuitBreaker.onHalfOpen(() => {
    console.info('[CircuitBreaker] HALF-OPEN -- testing with next request');
  });

  circuitBreaker.onReset(() => {
    console.info('[CircuitBreaker] CLOSED -- recovered');
  });

  return circuitBreaker;
}

// Sampling circuit breaker: opens when failure rate exceeds threshold over a time window
export function createSamplingCircuitBreaker(options?: {
  threshold?: number;
  duration?: number;
  minimumRps?: number;
  halfOpenAfterMs?: number;
}) {
  const {
    threshold = 0.5,      // 50% failure rate
    duration = 30_000,    // Over 30 second window
    minimumRps = 5,       // Minimum 5 requests/sec before circuit activates
    halfOpenAfterMs = 15_000,
  } = options ?? {};

  const circuitBreaker = new CircuitBreakerPolicy(handleAll, {
    halfOpenAfter: halfOpenAfterMs,
    breaker: new SamplingBreaker({ threshold, duration, minimumRps }),
  });

  circuitBreaker.onBreak(() => {
    console.warn(
      `[CircuitBreaker] OPEN -- failure rate exceeded ${threshold * 100}% threshold`
    );
  });

  circuitBreaker.onHalfOpen(() => {
    console.info('[CircuitBreaker] HALF-OPEN -- testing recovery');
  });

  circuitBreaker.onReset(() => {
    console.info('[CircuitBreaker] CLOSED -- service recovered');
  });

  return circuitBreaker;
}
