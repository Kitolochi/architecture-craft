import { TimeoutPolicy, timeout, TimeoutStrategy } from "cockatiel";

interface TimeoutOptions {
  timeoutMs: number;
  strategy?: "cooperative" | "aggressive";
}

/**
 * Timeout that cancels operations exceeding the deadline.
 *
 * Cooperative: passes AbortSignal — the operation must check it.
 * Aggressive: resolves immediately on timeout, even if operation continues.
 */
export function createTimeout(options: TimeoutOptions): TimeoutPolicy {
  const strategy =
    options.strategy === "aggressive"
      ? TimeoutStrategy.Aggressive
      : TimeoutStrategy.Cooperative;

  const policy = timeout(options.timeoutMs, strategy);

  policy.onTimeout(() => {
    console.warn(`  [timeout] Operation exceeded ${options.timeoutMs}ms`);
  });

  return policy;
}

interface AdaptiveTimeoutOptions {
  initialTimeoutMs: number;
  minTimeoutMs: number;
  maxTimeoutMs: number;
  percentile: number; // e.g., 0.99 for p99
  multiplier: number; // timeout = p99 * multiplier
}

/**
 * Adaptive timeout that adjusts based on observed latency.
 * Tracks recent call durations and sets timeout at percentile * multiplier.
 *
 * This prevents both:
 * - Timeouts too tight (kills normal slow calls)
 * - Timeouts too loose (waits forever on broken dependencies)
 */
export function createAdaptiveTimeout(options: AdaptiveTimeoutOptions) {
  const latencies: number[] = [];
  const MAX_SAMPLES = 100;
  let currentTimeoutMs = options.initialTimeoutMs;

  function updateTimeout(): void {
    if (latencies.length < 5) return; // Need minimum samples

    const sorted = [...latencies].sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * options.percentile);
    const percentileLatency = sorted[Math.min(idx, sorted.length - 1)];

    currentTimeoutMs = Math.min(
      options.maxTimeoutMs,
      Math.max(options.minTimeoutMs, Math.round(percentileLatency * options.multiplier))
    );
  }

  return {
    get currentTimeoutMs() {
      return currentTimeoutMs;
    },

    async execute<T>(fn: () => Promise<T>): Promise<T> {
      const policy = timeout(currentTimeoutMs, TimeoutStrategy.Cooperative);
      const start = Date.now();

      try {
        const result = await policy.execute(fn);
        latencies.push(Date.now() - start);
        if (latencies.length > MAX_SAMPLES) latencies.shift();
        updateTimeout();
        return result;
      } catch (err) {
        // Don't add timeout durations to the sample (they'd skew high)
        updateTimeout();
        throw err;
      }
    },
  };
}
