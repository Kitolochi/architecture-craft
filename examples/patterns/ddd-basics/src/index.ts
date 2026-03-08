import { Money } from './value-objects/money';
import { Email } from './value-objects/email';
import { Order } from './entities/order';

// --- Demo: exercise DDD building blocks ---

// 1. Value Objects: equality by value, immutability, self-validating

const price = new Money(29.99, 'USD');
const tax = new Money(2.40, 'USD');
const total = price.add(tax);
console.log(`Price: ${price}, Tax: ${tax}, Total: ${total}`);

const samePrice = new Money(29.99, 'USD');
console.log(`Value equality: ${price.equals(samePrice)}`); // true

const email = new Email('Alice@Example.COM');
console.log(`Normalized email: ${email}, domain: ${email.domain}`);

// 2. Entity with identity: Order

const order = new Order('order-1', new Email('customer@shop.com'));

// 3. Aggregate Root: Order controls access to OrderLines

order.addLine('prod-1', 'TypeScript Handbook', 2, new Money(39.99, 'USD'));
order.addLine('prod-2', 'Design Patterns Book', 1, new Money(49.99, 'USD'));
console.log(`\nOrder ${order.id}: ${order.lines.length} lines, total ${order.total()}`);

// Adding same product increases quantity (aggregate invariant)
order.addLine('prod-1', 'TypeScript Handbook', 1, new Money(39.99, 'USD'));
const tsLine = order.lines.find((l) => l.productId === 'prod-1')!;
console.log(`After adding more: prod-1 quantity = ${tsLine.quantity}`);

// Remove a line through the aggregate root
order.removeLine('prod-2');
console.log(`After removing prod-2: ${order.lines.length} lines, total ${order.total()}`);

// 4. Lifecycle transitions with domain events

order.place();
console.log(`Order status: ${order.status}`);

// Cannot modify a placed order (aggregate invariant)
try {
  order.addLine('prod-3', 'Clean Code', 1, new Money(34.99, 'USD'));
} catch (err) {
  console.log(`Expected error: ${(err as Error).message}`);
}

// Cannot place an already-placed order
try {
  order.place();
} catch (err) {
  console.log(`Expected error: ${(err as Error).message}`);
}

order.ship('TRK-98765');
console.log(`Shipped with tracking: ${order.trackingNumber}`);

// 5. Domain Events: drain events collected during the aggregate's lifecycle

const events = order.drainEvents();
console.log(`\nDomain events (${events.length}):`);
for (const event of events) {
  console.log(`  ${event.type} at ${event.occurredAt.toISOString()}`);
}

// Draining again returns empty (events are one-shot)
console.log(`Events after drain: ${order.drainEvents().length}`);

// 6. Value Object validation

try {
  new Money(-5, 'USD');
} catch (err) {
  console.log(`\nExpected error: ${(err as Error).message}`);
}

try {
  new Email('not-an-email');
} catch (err) {
  console.log(`Expected error: ${(err as Error).message}`);
}

try {
  price.add(new Money(10, 'EUR'));
} catch (err) {
  console.log(`Expected error: ${(err as Error).message}`);
}

export { Money, Email, Order };
export { InvalidMoneyError, CurrencyMismatchError } from './value-objects/money';
export { InvalidEmailError } from './value-objects/email';
export { InvalidOrderError } from './entities/order';
export type { OrderLine, OrderStatus } from './entities/order';
export type {
  DomainEvent,
  OrderPlacedEvent,
  OrderShippedEvent,
  OrderLineAddedEvent,
  OrderLineRemovedEvent,
} from './events/domain-events';
