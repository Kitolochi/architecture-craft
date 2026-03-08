import { BulkheadPolicy, bulkhead } from "cockatiel";

interface BulkheadOptions {
  maxConcurrent: number;
  maxQueue: number;
}

/**
 * Create a bulkhead that limits concurrent executions.
 * Requests beyond maxConcurrent queue up to maxQueue, then reject.
 *
 * Use case: Prevent a slow downstream service from consuming
 * all your server's threads/connections.
 */
export function createBulkhead(options: BulkheadOptions): BulkheadPolicy {
  const policy = bulkhead(options.maxConcurrent, options.maxQueue);

  policy.onReject(() => {
    console.warn(`[bulkhead] Request rejected — queue full (max ${options.maxQueue})`);
  });

  return policy;
}

/**
 * Create isolated bulkheads per resource type.
 * Each resource gets its own concurrency pool so a slow database
 * can't starve your external API calls (and vice versa).
 */
export function createResourceBulkhead() {
  return {
    database: createBulkhead({ maxConcurrent: 5, maxQueue: 10 }),
    externalApi: createBulkhead({ maxConcurrent: 3, maxQueue: 5 }),
    cache: createBulkhead({ maxConcurrent: 10, maxQueue: 20 }),
  };
}
