import type { Command, CommandResult } from '../types/order.types';

// A command handler processes exactly one command type and returns a result.
// Commands represent intent to change state -- they are imperative ("do this").
type CommandHandler<T extends Command> = (command: T) => CommandResult;

export class CommandBus {
  private handlers = new Map<string, CommandHandler<any>>();

  // Register a handler for a specific command type.
  // Each command type must have exactly one handler (unlike events which can have many).
  register<T extends Command>(type: T['type'], handler: CommandHandler<T>): void {
    if (this.handlers.has(type)) {
      throw new Error(`Handler already registered for command: ${type}`);
    }
    this.handlers.set(type, handler);
  }

  // Dispatch a command to its registered handler.
  // Throws if no handler is found -- a command without a handler is a bug.
  dispatch<T extends Command>(command: T): CommandResult {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`No handler registered for command: ${command.type}`);
    }
    return handler(command);
  }
}
