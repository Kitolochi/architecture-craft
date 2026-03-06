import { EventBus } from './events/event-bus';
import { registerHandlers } from './events/handlers';

// Create singleton event bus
const eventBus = new EventBus();

// Register all handlers at startup
registerHandlers(eventBus);

export { eventBus, EventBus };
export type { EventMap } from './types/events';
