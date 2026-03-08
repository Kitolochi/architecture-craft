import { createTimeout, createAdaptiveTimeout } from "./policies/timeout.js";

// Simulate a slow service
async function slowService(delayMs: number, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(`Completed in ${delayMs}ms`), delayMs);

    // Respect AbortSignal for cooperative cancellation
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason ?? new Error("Aborted"));
    });
  });
}

async function main() {
  console.log("=== Timeout Pattern Demo ===\n");

  // 1. Basic timeout
  console.log("--- Basic Timeout (2s) ---");
  const timeout = createTimeout({ timeoutMs: 2000 });

  try {
    const fast = await timeout.execute(({ signal }) => slowService(500, signal));
    console.log("Fast call:", fast);
  } catch (err) {
    console.log("Fast call failed:", (err as Error).message);
  }

  try {
    const slow = await timeout.execute(({ signal }) => slowService(5000, signal));
    console.log("Slow call:", slow);
  } catch (err) {
    console.log("Slow call timed out:", (err as Error).message);
  }

  // 2. Adaptive timeout
  console.log("\n--- Adaptive Timeout (adjusts to p99 latency) ---");
  const adaptive = createAdaptiveTimeout({
    initialTimeoutMs: 2000,
    minTimeoutMs: 500,
    maxTimeoutMs: 10_000,
    percentile: 0.99,
    multiplier: 1.5,
  });

  // Simulate several calls to build latency profile
  for (let i = 0; i < 5; i++) {
    const delay = 200 + Math.random() * 300;
    try {
      const result = await adaptive.execute(async () => {
        await new Promise((r) => setTimeout(r, delay));
        return `Call ${i + 1}: ${Math.round(delay)}ms`;
      });
      console.log(result, `(timeout: ${adaptive.currentTimeoutMs}ms)`);
    } catch (err) {
      console.log(`Call ${i + 1} timed out:`, (err as Error).message);
    }
  }
}

main().catch(console.error);
