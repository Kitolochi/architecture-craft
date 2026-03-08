import { InventoryService, PaymentService, NotificationService } from './services.js';
import { createPlaceOrderSaga } from './place-order-saga.js';
import type { PlaceOrderContext } from './place-order-saga.js';

// Composition root: wire services and run saga scenarios.
//
// The saga orchestrator coordinates the distributed transaction.
// We demonstrate three scenarios:
// 1. Happy path (all steps succeed)
// 2. Payment failure (inventory is compensated)
// 3. Notification failure (payment and inventory are compensated)

const inventory = new InventoryService();
const payment = new PaymentService();
const notification = new NotificationService();

// Seed inventory
inventory.addStock('laptop-1', 10);
inventory.addStock('mouse-1', 50);

async function runDemo(): Promise<void> {
  // --- Scenario 1: Happy path ---
  console.log('=== Scenario 1: Successful Order ===\n');

  const saga1 = createPlaceOrderSaga(inventory, payment, notification);
  const ctx1: PlaceOrderContext = {
    orderId: 'order-1',
    email: 'alice@example.com',
    items: [
      { productId: 'laptop-1', quantity: 1, unitPrice: 1299.99 },
      { productId: 'mouse-1', quantity: 2, unitPrice: 79.99 },
    ],
  };

  const result1 = await saga1.run(ctx1);
  console.log('\nResult:', {
    success: result1.success,
    steps: result1.steps.map((s) => `${s.name}: ${s.status}`),
  });

  // Check inventory after success
  const laptop = inventory.getItem('laptop-1');
  const mouse = inventory.getItem('mouse-1');
  console.log(`Inventory: laptop=${laptop?.available}, mouse=${mouse?.available}`);

  // --- Scenario 2: Payment failure ---
  console.log('\n\n=== Scenario 2: Payment Failure (compensation) ===\n');

  payment.setFailMode(true); // Simulate payment gateway down

  const saga2 = createPlaceOrderSaga(inventory, payment, notification);
  const ctx2: PlaceOrderContext = {
    orderId: 'order-2',
    email: 'bob@example.com',
    items: [
      { productId: 'laptop-1', quantity: 1, unitPrice: 1299.99 },
    ],
  };

  const result2 = await saga2.run(ctx2);
  console.log('\nResult:', {
    success: result2.success,
    error: result2.error,
    steps: result2.steps.map((s) => `${s.name}: ${s.status}`),
  });

  // Inventory should be restored after compensation
  const laptopAfter = inventory.getItem('laptop-1');
  console.log(`Inventory after compensation: laptop=${laptopAfter?.available} (restored)`);

  payment.setFailMode(false); // Reset

  // --- Scenario 3: Notification failure ---
  console.log('\n\n=== Scenario 3: Notification Failure (full rollback) ===\n');

  notification.setFailMode(true); // Simulate email service down

  const saga3 = createPlaceOrderSaga(inventory, payment, notification);
  const ctx3: PlaceOrderContext = {
    orderId: 'order-3',
    email: 'charlie@example.com',
    items: [
      { productId: 'mouse-1', quantity: 3, unitPrice: 79.99 },
    ],
  };

  const result3 = await saga3.run(ctx3);
  console.log('\nResult:', {
    success: result3.success,
    error: result3.error,
    steps: result3.steps.map((s) => `${s.name}: ${s.status}`),
  });

  // Both payment and inventory should be rolled back
  const mouseAfter = inventory.getItem('mouse-1');
  console.log(`Inventory after full rollback: mouse=${mouseAfter?.available} (restored)`);

  notification.setFailMode(false);
}

runDemo().catch(console.error);

export { SagaOrchestrator } from './orchestrator.js';
export type { SagaStep, SagaResult, StepStatus, StepRecord } from './orchestrator.js';
export type { PlaceOrderContext } from './place-order-saga.js';
