// Module registry for dependency injection.
//
// Modules register their public API (interface) with the registry at startup.
// Other modules resolve dependencies through the registry, never via direct imports.
//
// This is the key enforcement mechanism: if module A wants to call module B,
// it must go through the registry. This makes dependencies explicit and ensures
// modules only depend on public interfaces, not internal implementations.
//
// When extracting a module to a microservice, you replace the registry lookup
// with an HTTP client that implements the same interface.

export class ModuleRegistry {
  private modules = new Map<string, unknown>();

  register<T>(name: string, api: T): void {
    if (this.modules.has(name)) {
      throw new Error(`Module "${name}" is already registered`);
    }
    this.modules.set(name, api);
    console.log(`[Registry] Module "${name}" registered`);
  }

  resolve<T>(name: string): T {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(
        `Module "${name}" not found. Available: ${Array.from(this.modules.keys()).join(', ')}`
      );
    }
    return module as T;
  }

  has(name: string): boolean {
    return this.modules.has(name);
  }
}
