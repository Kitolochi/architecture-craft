import { createBulkhead, createResourceBulkhead } from "./policies/bulkhead.js";

// ---- Demo: API endpoint bulkhead ----

const apiBulkhead = createBulkhead({
  maxConcurrent: 3,
  maxQueue: 5,
});

async function simulateApiCall(id: number): Promise<string> {
  return apiBulkhead.execute(async () => {
    console.log(`[API ${id}] Started (active: within bulkhead limit)`);
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
    console.log(`[API ${id}] Completed`);
    return `Result ${id}`;
  });
}

// ---- Demo: Resource-separated bulkheads ----

const resources = createResourceBulkhead();

async function simulateDbCall(id: number): Promise<string> {
  return resources.database.execute(async () => {
    console.log(`[DB ${id}] Query started`);
    await new Promise((r) => setTimeout(r, 500));
    console.log(`[DB ${id}] Query completed`);
    return `Row ${id}`;
  });
}

async function simulateExternalApi(id: number): Promise<string> {
  return resources.externalApi.execute(async () => {
    console.log(`[EXT ${id}] Call started`);
    await new Promise((r) => setTimeout(r, 800));
    console.log(`[EXT ${id}] Call completed`);
    return `External ${id}`;
  });
}

// ---- Run demos ----

async function main() {
  console.log("=== Bulkhead Pattern Demo ===\n");

  console.log("--- API Bulkhead (max 3 concurrent, queue 5) ---");
  const apiPromises = Array.from({ length: 8 }, (_, i) =>
    simulateApiCall(i + 1).catch((err) => `[API ${i + 1}] Rejected: ${err.message}`)
  );
  const apiResults = await Promise.allSettled(apiPromises);
  console.log("\nAPI Results:", apiResults.map((r) => r.status === "fulfilled" ? r.value : r.reason));

  console.log("\n--- Resource Bulkheads (isolated pools) ---");
  const resourcePromises = [
    ...Array.from({ length: 4 }, (_, i) => simulateDbCall(i + 1)),
    ...Array.from({ length: 4 }, (_, i) => simulateExternalApi(i + 1)),
  ];
  const resourceResults = await Promise.all(resourcePromises.map((p) => p.catch((e: Error) => e.message)));
  console.log("\nResource Results:", resourceResults);
}

main().catch(console.error);
