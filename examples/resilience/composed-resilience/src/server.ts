import express from "express";
import { createResilientClient } from "./policies/composed.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ---- Simulated external service ----

let requestCount = 0;
async function externalUserService(userId: string, signal?: AbortSignal): Promise<object> {
  requestCount++;

  // Simulate various failure modes
  const roll = Math.random();

  // 20% chance: slow response
  if (roll < 0.2) {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(undefined), 5000);
      signal?.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(new Error("Aborted"));
      });
    });
  }

  // 15% chance: transient error
  if (roll > 0.8) {
    throw new Error("Connection reset by peer");
  }

  return { id: userId, name: `User ${userId}`, requestCount };
}

// ---- Resilient client with composed policies ----

const userClient = createResilientClient({
  timeout: 2000,
  retry: { maxAttempts: 3, initialDelay: 200 },
  circuitBreaker: { threshold: 5, halfOpenAfter: 10_000 },
  bulkhead: { maxConcurrent: 5, maxQueue: 10 },
  fallback: async (userId: string) => ({
    id: userId,
    name: "Unknown User",
    source: "cache-fallback",
  }),
});

// ---- Express routes ----

app.get("/user/:id", async (req, res) => {
  try {
    const user = await userClient.execute(
      req.params.id,
      (id, signal) => externalUserService(id, signal)
    );
    res.json({ data: user, resilience: userClient.stats() });
  } catch (err) {
    res.status(503).json({
      error: (err as Error).message,
      resilience: userClient.stats(),
    });
  }
});

app.get("/stats", (_req, res) => {
  res.json(userClient.stats());
});

app.listen(PORT, () => {
  console.log(`Composed resilience demo on http://localhost:${PORT}`);
  console.log("Try: GET /user/123 (repeat rapidly to see patterns)");
  console.log("     GET /stats (see resilience metrics)");
});
