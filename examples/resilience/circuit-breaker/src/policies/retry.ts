import {
  retry,
  handleAll,
  handleType,
  ExponentialBackoff,
  ConstantBackoff,
} from 'cockatiel';

// Exponential backoff retry: 200ms, 400ms, 800ms (capped at 10s)
export function createExponentialRetry(options?: {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}) {
  const {
    maxAttempts = 3,
    initialDelayMs = 200,
    maxDelayMs = 10_000,
  } = options ?? {};

  const retryPolicy = retry(handleAll, {
    maxAttempts,
    backoff: new ExponentialBackoff({
      initialDelay: initialDelayMs,
      maxDelay: maxDelayMs,
      exponent: 2,
    }),
  });

  retryPolicy.onRetry(({ attempt }) => {
    console.warn(`[Retry] Attempt ${attempt} of ${maxAttempts}`);
  });

  retryPolicy.onGiveUp(({ reason }) => {
    console.error(`[Retry] All ${maxAttempts} attempts exhausted:`, reason);
  });

  return retryPolicy;
}

// Constant backoff retry: fixed delay between attempts
export function createConstantRetry(options?: {
  maxAttempts?: number;
  delayMs?: number;
}) {
  const { maxAttempts = 3, delayMs = 1_000 } = options ?? {};

  const retryPolicy = retry(handleAll, {
    maxAttempts,
    backoff: new ConstantBackoff(delayMs),
  });

  retryPolicy.onRetry(({ attempt }) => {
    console.warn(
      `[Retry] Attempt ${attempt} of ${maxAttempts} (fixed ${delayMs}ms delay)`
    );
  });

  retryPolicy.onGiveUp(({ reason }) => {
    console.error(`[Retry] All ${maxAttempts} attempts exhausted:`, reason);
  });

  return retryPolicy;
}

// Retry only on specific error types
export function createSelectiveRetry(
  errorClass: new (...args: any[]) => Error,
  options?: { maxAttempts?: number; initialDelayMs?: number }
) {
  const { maxAttempts = 3, initialDelayMs = 500 } = options ?? {};

  return retry(handleType(errorClass), {
    maxAttempts,
    backoff: new ExponentialBackoff({ initialDelay: initialDelayMs }),
  });
}
