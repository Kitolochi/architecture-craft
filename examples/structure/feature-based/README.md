# Feature-Based Project Structure

Organize code by business capability rather than technical layer. Each feature is a self-contained module with its own components, hooks, API calls, state, and types.

## Structure

```
src/
  features/
    auth/
      components/         # React components for this feature
        LoginForm.tsx
      hooks/              # Custom hooks for this feature
        useAuth.ts
      api/                # API call functions
        auth.api.ts
      store/              # Feature-local state (Zustand slice, etc.)
      types/              # TypeScript types for this feature
        auth.types.ts
    dashboard/
      components/
        Dashboard.tsx
      hooks/
      api/
      store/
      types/
        dashboard.types.ts
  shared/
    components/           # Truly shared UI primitives (Button, Input, Modal)
      Button.tsx
    hooks/                # Cross-cutting hooks (useFetch, useDebounce)
      useFetch.ts
    utils/                # Pure utility functions
    types/                # Global type definitions
  app/                    # App shell, routing, providers
    App.tsx
```

## Import Rules

1. **Features never import from other features.** If two features need to communicate, use the event bus pattern or lift shared logic to `shared/`.

2. **Shared code must earn its place.** Only extract to `shared/` when 3+ features need the same thing. Premature abstraction is worse than duplication.

3. **Import directly, not through barrels.** Within app source code, always use direct imports:
   ```ts
   // Good
   import { LoginForm } from '@/features/auth/components/LoginForm';

   // Bad -- don't create feature-level barrel files
   import { LoginForm } from '@/features/auth';
   ```

4. **The app shell composes features.** Only `src/app/` should import from multiple features to wire them together via routing and layout.

## Path Aliases

Configure `@/` to point to `src/` in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```
