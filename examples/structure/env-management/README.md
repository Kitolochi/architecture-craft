# Environment Management with Zod Validation

Type-safe environment variable loading with schema validation at startup. Crashes fast with clear error messages if required variables are missing or malformed.

## How It Works

1. **Schema definition** -- A Zod schema describes every expected environment variable with types, defaults, and constraints.
2. **Validation at startup** -- `loadEnv()` runs once when the module is imported. If validation fails, the process exits with a clear list of issues.
3. **Type inference** -- The `Env` type is inferred from the schema, so all access is fully typed.

## Files

| File | Purpose |
|------|---------|
| `src/config/env.ts` | Zod schema, `loadEnv()`, and exported `env` singleton |
| `.env.example` | Documents all variables (checked into git) |
| `.env.development` | Local dev defaults (gitignored in real projects) |

## Usage

```ts
import { env } from './config/env';

// Fully typed -- IDE autocomplete works
console.log(env.PORT);           // number
console.log(env.DATABASE_URL);   // string
console.log(env.REDIS_URL);      // string | undefined
console.log(env.ENABLE_SIGNUP);  // boolean
```

## Error Output

If `JWT_SECRET` is missing and `DATABASE_URL` is malformed, the process exits with:

```
Invalid environment variables:
  DATABASE_URL: DATABASE_URL must be a valid connection URL
  JWT_SECRET: JWT_SECRET must be at least 32 characters for security
```

## Environment File Loading Order

1. `.env.{NODE_ENV}` is loaded first (e.g., `.env.development`)
2. `.env` is loaded as a fallback for any variables not already set
3. System environment variables always take precedence over file values

## Gitignore

```gitignore
.env
.env.development
.env.test
.env.production
# .env.example is checked in -- it documents required variables
```
