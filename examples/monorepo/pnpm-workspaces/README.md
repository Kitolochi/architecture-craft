# pnpm Workspaces Example

A monorepo using pnpm workspaces without a build orchestrator. Suitable for smaller projects that don't need Turborepo/Nx caching.

## Structure

```
my-pnpm-monorepo/
  apps/
    web/              # Next.js frontend (depends on @myorg/shared)
  packages/
    shared/           # Shared utilities and types
  pnpm-workspace.yaml
  package.json
```

## Key Concepts

### Workspace Protocol

Cross-package dependencies use the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@myorg/shared": "workspace:*"
  }
}
```

This resolves to the local workspace version during development. When publishing, pnpm replaces `workspace:*` with the actual version.

### Workspace Scripts

The root `package.json` uses pnpm's workspace flags:

| Script | Command | Purpose |
|--------|---------|---------|
| `build` | `pnpm -r --filter './packages/**' build && pnpm -r --filter './apps/**' build` | Build packages first, then apps |
| `dev` | `pnpm -r --parallel dev` | Run all dev servers in parallel |
| `lint` | `pnpm -r lint` | Lint all packages sequentially |
| `test` | `pnpm -r test` | Test all packages |

### Key Flags

- `-r` (recursive) -- Run in all workspace packages
- `--filter <pattern>` -- Run only in matching packages
- `--parallel` -- Run in all packages simultaneously (for dev servers)

## Usage

```bash
# Install all dependencies
pnpm install

# Build everything (packages first, then apps)
pnpm build

# Run all dev servers
pnpm dev

# Run a command in a specific package
pnpm --filter @myorg/web dev
pnpm --filter @myorg/shared build

# Add a dependency to a specific package
cd apps/web && pnpm add @myorg/shared --workspace

# Add a dev dependency to the root
pnpm add -D prettier -w
```
