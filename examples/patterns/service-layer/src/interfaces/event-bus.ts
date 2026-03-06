export interface EventBus {
  publish<T>(event: string, payload: T): Promise<void>;
}
