import { createResilientPolicy } from './policies/composed';
import { createCircuitBreaker } from './policies/circuit-breaker';
import { createExponentialRetry } from './policies/retry';

// Export individual policy factories for selective use
export {
  createCircuitBreaker,
  createSamplingCircuitBreaker,
} from './policies/circuit-breaker';

export {
  createExponentialRetry,
  createConstantRetry,
  createSelectiveRetry,
} from './policies/retry';

export { createResilientPolicy } from './policies/composed';

// Usage example: create a composed resilient policy for an external API
const apiPolicy = createResilientPolicy({
  timeoutMs: 3_000,
  maxRetries: 3,
  consecutiveFailures: 5,
  halfOpenAfterMs: 30_000,
});

// Use it to wrap any async call
async function fetchUserProfile(userId: string) {
  return apiPolicy.execute(async ({ signal }) => {
    const res = await fetch(`https://api.example.com/users/${userId}`, {
      signal,
    });

    if (!res.ok) {
      throw new Error(`API responded with ${res.status}`);
    }

    return res.json();
  });
}

// Individual policies can also be used standalone
const breaker = createCircuitBreaker({ consecutiveFailures: 3 });
const retrier = createExponentialRetry({ maxAttempts: 2 });

async function sendNotification(message: string) {
  return breaker.execute(() =>
    retrier.execute(() =>
      fetch('https://notify.example.com/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
    )
  );
}
