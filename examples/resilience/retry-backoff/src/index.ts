import {
  createExponentialRetry,
  createConstantRetry,
  createSelectiveRetry,
} from "./policies/retry.js";

// Simulate an unreliable API
let callCount = 0;
async function unreliableApi(): Promise<string> {
  callCount++;
  if (callCount % 3 !== 0) {
    throw new Error(`Transient failure (attempt ${callCount})`);
  }
  return `Success on attempt ${callCount}`;
}

// Simulate different error types
async function apiWithErrors(type: "transient" | "permanent"): Promise<string> {
  if (type === "permanent") {
    const err = new Error("Invalid API key");
    (err as any).statusCode = 401;
    throw err;
  }
  if (Math.random() > 0.5) {
    const err = new Error("Service unavailable");
    (err as any).statusCode = 503;
    throw err;
  }
  return "OK";
}

async function main() {
  console.log("=== Retry + Backoff Pattern Demo ===\n");

  // 1. Exponential backoff with jitter
  console.log("--- Exponential Retry (max 4 attempts, 200ms initial) ---");
  const exponential = createExponentialRetry({
    maxAttempts: 4,
    initialDelayMs: 200,
  });

  callCount = 0;
  try {
    const result = await exponential.execute(() => unreliableApi());
    console.log("Result:", result);
  } catch (err) {
    console.log("Failed after all retries:", (err as Error).message);
  }

  // 2. Constant delay retry
  console.log("\n--- Constant Retry (max 3 attempts, 500ms delay) ---");
  const constant = createConstantRetry({
    maxAttempts: 3,
    delayMs: 500,
  });

  callCount = 0;
  try {
    const result = await constant.execute(() => unreliableApi());
    console.log("Result:", result);
  } catch (err) {
    console.log("Failed:", (err as Error).message);
  }

  // 3. Selective retry (only retry transient errors)
  console.log("\n--- Selective Retry (skip 4xx errors) ---");
  const selective = createSelectiveRetry({ maxAttempts: 3 });

  try {
    await selective.execute(() => apiWithErrors("permanent"));
  } catch (err) {
    console.log("Correctly skipped retry for:", (err as Error).message);
  }
}

main().catch(console.error);
