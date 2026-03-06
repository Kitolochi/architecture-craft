import type { EventMap } from '../types/events';

type EventHandler<T> = (payload: T) => Promise<void>;

export class EventBus {
  private handlers = new Map<string, EventHandler<any>[]>();

  on<K extends keyof EventMap>(
    event: K,
    handler: EventHandler<EventMap[K]>
  ): void {
    const existing = this.handlers.get(event as string) || [];
    existing.push(handler);
    this.handlers.set(event as string, existing);
  }

  async publish<K extends keyof EventMap>(
    event: K,
    payload: EventMap[K]
  ): Promise<void> {
    const handlers = this.handlers.get(event as string) || [];

    if (handlers.length === 0) {
      return;
    }

    const results = await Promise.allSettled(
      handlers.map((handler) => handler(payload))
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        console.error(
          `Event handler failed for "${String(event)}":`,
          result.reason
        );
      }
    }
  }

  off<K extends keyof EventMap>(
    event: K,
    handler: EventHandler<EventMap[K]>
  ): void {
    const existing = this.handlers.get(event as string) || [];
    this.handlers.set(
      event as string,
      existing.filter((h) => h !== handler)
    );
  }

  listenerCount(event: keyof EventMap): number {
    return (this.handlers.get(event as string) || []).length;
  }

  removeAllListeners(event?: keyof EventMap): void {
    if (event) {
      this.handlers.delete(event as string);
    } else {
      this.handlers.clear();
    }
  }
}
