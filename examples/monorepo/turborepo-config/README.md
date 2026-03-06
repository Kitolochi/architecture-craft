# Turborepo Configuration Example

A production-ready Turborepo monorepo setup with pnpm workspaces.

## Structure

```
my-turborepo/
  apps/
    web/          # Next.js frontend
    api/          # Fastify backend service
  packages/
    ui/           # Shared React components
    config/       # Shared ESLint, TS configs
  turbo.json      # Turborepo pipeline configuration
  pnpm-workspace.yaml
  package.json
```

## Key Files

- **turbo.json** -- Pipeline definitions for build, lint, test, and dev tasks with proper dependency ordering and caching
- **pnpm-workspace.yaml** -- Declares workspace package locations
- **package.json** -- Root scripts that delegate to Turbo

## Pipeline

| Task    | Depends On | Cached | Notes |
|---------|-----------|--------|-------|
| `build` | `^build`  | Yes    | Builds dependencies first, caches `dist/` and `.next/` |
| `lint`  | `^build`  | Yes    | Lints after dependencies are built (for type checking) |
| `test`  | `build`   | Yes    | Only re-runs when `src/` or `test/` files change |
| `dev`   | --        | No     | Long-running dev servers, never cached |

## Usage

```bash
# Install dependencies
pnpm install

# Run all builds (respects dependency graph)
pnpm build

# Run dev servers for all apps
pnpm dev

# Build only the web app and its dependencies
pnpm turbo build --filter=@myorg/web

# Build everything that changed since main
pnpm turbo build --filter=...[main]
```

## Cross-Package Dependencies

Packages reference each other via `workspace:*` protocol in their `package.json`:

```json
{
  "dependencies": {
    "@myorg/ui": "workspace:*",
    "@myorg/config": "workspace:*"
  }
}
```

This ensures they always use the local workspace version during development.
