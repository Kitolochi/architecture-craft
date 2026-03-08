// Aggregate Root: Order is the entry point for the Order aggregate.
// All modifications to OrderLines go through the Order to protect
// invariants. External code never modifies OrderLines directly.

import { Money } from '../value-objects/money';
import { Email } from '../value-objects/email';
import { DomainEventCollector } from '../events/domain-events';
import type {
  DomainEvent,
  OrderPlacedEvent,
  OrderShippedEvent,
  OrderLineAddedEvent,
  OrderLineRemovedEvent,
} from '../events/domain-events';

export type OrderStatus = 'draft' | 'placed' | 'shipped';

// Entity: OrderLine has identity within its aggregate (productId),
// but is not independently accessible -- always through Order.
export interface OrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: Money;
}

export class Order {
  readonly id: string;
  private _customerEmail: Email;
  private _lines: OrderLine[] = [];
  private _status: OrderStatus = 'draft';
  private _trackingNumber?: string;
  readonly createdAt: Date;
  private events = new DomainEventCollector();

  constructor(id: string, customerEmail: Email) {
    this.id = id;
    this._customerEmail = customerEmail;
    this.createdAt = new Date();
  }

  get customerEmail(): Email {
    return this._customerEmail;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get trackingNumber(): string | undefined {
    return this._trackingNumber;
  }

  get lines(): ReadonlyArray<OrderLine> {
    return this._lines;
  }

  // Aggregate root controls all access to its children (OrderLines).
  // This ensures invariants like "cannot modify a shipped order" are
  // always enforced.

  addLine(productId: string, productName: string, quantity: number, unitPrice: Money): void {
    this.assertModifiable();

    if (quantity <= 0) {
      throw new InvalidOrderError('Quantity must be positive');
    }

    // If the product already exists, increase quantity instead of duplicating
    const existing = this._lines.find((l) => l.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this._lines.push({ productId, productName, quantity, unitPrice });
    }

    this.events.record({
      type: 'OrderLineAdded',
      occurredAt: new Date(),
      orderId: this.id,
      productId,
      quantity,
      lineTotal: unitPrice.multiply(quantity),
    } satisfies OrderLineAddedEvent);
  }

  removeLine(productId: string): void {
    this.assertModifiable();

    const index = this._lines.findIndex((l) => l.productId === productId);
    if (index === -1) {
      throw new InvalidOrderError(`Product ${productId} not found in order`);
    }

    this._lines.splice(index, 1);

    this.events.record({
      type: 'OrderLineRemoved',
      occurredAt: new Date(),
      orderId: this.id,
      productId,
    } satisfies OrderLineRemovedEvent);
  }

  // Transition the order from draft to placed.
  // Business rule: an order must have at least one line to be placed.
  place(): void {
    if (this._status !== 'draft') {
      throw new InvalidOrderError(`Order ${this.id} is already ${this._status}`);
    }

    if (this._lines.length === 0) {
      throw new InvalidOrderError('Cannot place an empty order');
    }

    this._status = 'placed';

    this.events.record({
      type: 'OrderPlaced',
      occurredAt: new Date(),
      orderId: this.id,
      customerEmail: this._customerEmail.value,
      total: this.total(),
      itemCount: this._lines.length,
    } satisfies OrderPlacedEvent);
  }

  ship(trackingNumber: string): void {
    if (this._status !== 'placed') {
      throw new InvalidOrderError(
        `Cannot ship order ${this.id} (status: ${this._status})`
      );
    }

    this._status = 'shipped';
    this._trackingNumber = trackingNumber;

    this.events.record({
      type: 'OrderShipped',
      occurredAt: new Date(),
      orderId: this.id,
      trackingNumber,
      shippedAt: new Date(),
    } satisfies OrderShippedEvent);
  }

  // Calculated from child entities -- the aggregate root is the
  // single source of truth for the order total.
  total(): Money {
    if (this._lines.length === 0) {
      return new Money(0, 'USD');
    }

    return this._lines.reduce(
      (sum, line) => sum.add(line.unitPrice.multiply(line.quantity)),
      new Money(0, this._lines[0]!.unitPrice.currency)
    );
  }

  // Domain events are collected during the aggregate's lifecycle and
  // drained after the aggregate is persisted. This prevents events
  // from being published if persistence fails.
  drainEvents(): DomainEvent[] {
    return this.events.drain();
  }

  private assertModifiable(): void {
    if (this._status === 'shipped') {
      throw new InvalidOrderError(`Cannot modify shipped order ${this.id}`);
    }
    if (this._status === 'placed') {
      throw new InvalidOrderError(`Cannot modify placed order ${this.id}`);
    }
  }
}

export class InvalidOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrderError';
  }
}
