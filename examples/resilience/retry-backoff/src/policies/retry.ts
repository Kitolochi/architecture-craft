import {
  ExponentialBackoff,
  ConstantBackoff,
  retry,
  handleAll,
  handleWhen,
  RetryPolicy,
} from "cockatiel";

interface ExponentialRetryOptions {
  maxAttempts: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

/**
 * Exponential backoff with full jitter.
 *
 * Delay pattern: random(0, min(maxDelay, initial * 2^attempt))
 * Jitter prevents thundering herd when many clients retry simultaneously.
 */
export function createExponentialRetry(options: ExponentialRetryOptions): RetryPolicy {
  const policy = retry(handleAll, {
    maxAttempts: options.maxAttempts,
    backoff: new ExponentialBackoff({
      initialDelay: options.initialDelayMs ?? 200,
      maxDelay: options.maxDelayMs ?? 30_000,
    }),
  });

  policy.onRetry(({ attempt, delay }) => {
    console.log(`  [retry] Attempt ${attempt}, waiting ${delay}ms`);
  });

  policy.onGiveUp((reason) => {
    const msg = 'error' in reason ? reason.error.message : `Unexpected value: ${reason.value}`;
    console.log(`  [retry] Gave up: ${msg}`);
  });

  return policy;
}

interface ConstantRetryOptions {
  maxAttempts: number;
  delayMs: number;
}

/**
 * Constant delay between retries.
 * Simpler but can cause thundering herd. Use for idempotent internal calls.
 */
export function createConstantRetry(options: ConstantRetryOptions): RetryPolicy {
  const policy = retry(handleAll, {
    maxAttempts: options.maxAttempts,
    backoff: new ConstantBackoff(options.delayMs),
  });

  policy.onRetry(({ attempt }) => {
    console.log(`  [retry] Attempt ${attempt}, waiting ${options.delayMs}ms`);
  });

  return policy;
}

interface SelectiveRetryOptions {
  maxAttempts: number;
  initialDelayMs?: number;
}

/**
 * Only retry transient errors (5xx, network). Skip permanent errors (4xx).
 * This prevents wasting retries on errors that will never succeed.
 */
export function createSelectiveRetry(options: SelectiveRetryOptions): RetryPolicy {
  const isTransient = handleWhen((err) => {
    const status = (err as any).statusCode;
    // Retry 5xx and network errors, not 4xx
    if (status && status >= 400 && status < 500) return false;
    return true;
  });

  const policy = retry(isTransient, {
    maxAttempts: options.maxAttempts,
    backoff: new ExponentialBackoff({
      initialDelay: options.initialDelayMs ?? 200,
    }),
  });

  policy.onRetry(({ attempt }) => {
    console.log(`  [selective-retry] Attempt ${attempt}`);
  });

  return policy;
}
