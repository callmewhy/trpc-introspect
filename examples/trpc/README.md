# Example: tRPC Server

A tRPC API server demonstrating `@api-introspect/trpc` integration.

## Run

```bash
# From monorepo root
pnpm dev:trpc
```

Server starts on <http://localhost:3000>

## Endpoints

### User Management (`user.*`)

| Procedure      | Type     | Auth | Description       |
| -------------- | -------- | ---- | ----------------- |
| `user.list`    | query    | No   | List all users    |
| `user.getById` | query    | No   | Get a user by ID  |
| `user.create`  | mutation | Yes  | Create a new user |
| `user.update`  | mutation | Yes  | Update a user     |
| `user.delete`  | mutation | Yes  | Delete a user     |

### Health (`health.*`)

| Procedure      | Type  | Auth | Description                  |
| -------------- | ----- | ---- | ---------------------------- |
| `health.check` | query | No   | Health status with timestamp |

## Introspection

```bash
# Get all procedures
curl http://localhost:3000/_introspect

# Filter by namespace
curl http://localhost:3000/_introspect.user

# Use the CLI
npx api-introspect http://localhost:3000
```

## What This Demonstrates

- tRPC router setup with queries and mutations
- Zod input validation schemas
- Bearer token authentication middleware
- `withIntrospection()` integration with metadata
- Automatic schema extraction and prefix sub-routes
