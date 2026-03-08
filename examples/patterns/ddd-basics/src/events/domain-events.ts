// Domain Events: record things that happened in the domain.
// They are named in past tense because they represent facts.
// Events are published by aggregates and consumed by other parts
// of the system for side effects (notifications, projections, etc.).

import type { Money } from '../value-objects/money';

export interface DomainEvent {
  readonly type: string;
  readonly occurredAt: Date;
}

export interface OrderPlacedEvent extends DomainEvent {
  type: 'OrderPlaced';
  orderId: string;
  customerEmail: string;
  total: Money;
  itemCount: number;
}

export interface OrderShippedEvent extends DomainEvent {
  type: 'OrderShipped';
  orderId: string;
  trackingNumber: string;
  shippedAt: Date;
}

export interface OrderLineAddedEvent extends DomainEvent {
  type: 'OrderLineAdded';
  orderId: string;
  productId: string;
  quantity: number;
  lineTotal: Money;
}

export interface OrderLineRemovedEvent extends DomainEvent {
  type: 'OrderLineRemoved';
  orderId: string;
  productId: string;
}

export type OrderEvent =
  | OrderPlacedEvent
  | OrderShippedEvent
  | OrderLineAddedEvent
  | OrderLineRemovedEvent;

// Simple event collector that aggregates use to buffer events
// before they are dispatched after a successful persistence operation.

export class DomainEventCollector {
  private events: DomainEvent[] = [];

  record(event: DomainEvent): void {
    this.events.push(event);
  }

  drain(): DomainEvent[] {
    const pending = [...this.events];
    this.events = [];
    return pending;
  }

  peek(): ReadonlyArray<DomainEvent> {
    return this.events;
  }
}
