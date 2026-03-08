import type { OrderWriteModel, OrderReadModel, OrderSummary } from '../types/order.types';

// In-memory store that maintains separate write and read models.
// In production, the write side might use a relational DB while the read
// side uses a document store or cache, synchronized via domain events.

let counter = 0;

function nextId(): string {
  return `order-${++counter}`;
}

export class OrderWriteStore {
  private orders = new Map<string, OrderWriteModel>();

  save(order: Omit<OrderWriteModel, 'id' | 'createdAt' | 'updatedAt'>): OrderWriteModel {
    const id = nextId();
    const now = new Date();
    const record: OrderWriteModel = { id, ...order, createdAt: now, updatedAt: now };
    this.orders.set(id, record);
    return record;
  }

  findById(id: string): OrderWriteModel | null {
    return this.orders.get(id) ?? null;
  }

  update(id: string, data: Partial<OrderWriteModel>): OrderWriteModel {
    const existing = this.orders.get(id);
    if (!existing) {
      throw new Error(`Order ${id} not found in write store`);
    }
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.orders.set(id, updated);
    return updated;
  }
}

// Read store is a projection -- denormalized views built from write-side events.
// It could be rebuilt from scratch by replaying the event log.

export class OrderReadStore {
  private orders = new Map<string, OrderReadModel>();

  project(writeModel: OrderWriteModel): void {
    const total = writeModel.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const readModel: OrderReadModel = {
      id: writeModel.id,
      userId: writeModel.userId,
      items: writeModel.items,
      status: writeModel.status,
      total,
      itemCount: writeModel.items.length,
      trackingNumber: writeModel.trackingNumber,
      createdAt: writeModel.createdAt,
    };

    this.orders.set(writeModel.id, readModel);
  }

  findById(id: string): OrderReadModel | null {
    return this.orders.get(id) ?? null;
  }

  findByUserId(userId: string, limit = 50, offset = 0): OrderReadModel[] {
    return Array.from(this.orders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  getSummary(id: string): OrderSummary | null {
    const order = this.orders.get(id);
    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      total: order.total,
      itemCount: order.itemCount,
      createdAt: order.createdAt,
    };
  }
}
