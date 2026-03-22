# Example: Fastify Server

A Fastify REST API server demonstrating `@api-introspect/fastify` integration.

## Run

```bash
# From monorepo root
pnpm dev:fastify
```

Server starts on <http://localhost:3001>

## Endpoints

### User Management (`/user`)

| Method | Path        | Auth | Description       |
| ------ | ----------- | ---- | ----------------- |
| GET    | `/user`     | No   | List all users    |
| GET    | `/user/:id` | No   | Get a user by ID  |
| POST   | `/user`     | Yes  | Create a new user |
| PATCH  | `/user/:id` | Yes  | Update a user     |
| DELETE | `/user/:id` | Yes  | Delete a user     |

### Health (`/health`)

| Method | Path      | Auth | Description                  |
| ------ | --------- | ---- | ---------------------------- |
| GET    | `/health` | No   | Health status with timestamp |

## Introspection

```bash
# Get all endpoints
curl http://localhost:3001/_introspect

# Use the CLI
npx api-introspect http://localhost:3001
```

## What This Demonstrates

- Fastify route setup with TypeBox schemas
- JSON Schema input/output definitions
- Bearer token authentication via `preHandler` hooks
- `app.register(introspection)` plugin integration with metadata
- Automatic route collection and schema extraction
