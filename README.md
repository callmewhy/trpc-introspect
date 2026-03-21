# api-introspect

[![CI](https://github.com/callmewhy/api-introspect/actions/workflows/ci.yml/badge.svg)](https://github.com/callmewhy/api-introspect/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/api-introspect)](https://github.com/callmewhy/api-introspect/blob/main/LICENSE)

API introspection SDK.
Adds endpoints that return all available API procedures with their types,
descriptions, and input/output schemas as JSON Schema.
Designed for AI agents to autonomously
discover and learn how to use your API.

## Packages

| Package                                         | Description                            |
| ----------------------------------------------- | -------------------------------------- |
| [`@api-introspect/core`](./packages/core)       | Framework-agnostic types and utilities |
| [`@api-introspect/trpc`](./packages/trpc)       | tRPC router introspection              |
| [`@api-introspect/fastify`](./packages/fastify) | Fastify introspection (coming soon)    |
| [`api-introspect`](./packages/cli)              | CLI and HTTP client                    |

## Quick Start (tRPC)

```bash
pnpm add @api-introspect/trpc
```

Peer dependencies: `@trpc/server >= 11`, `zod >= 4`

```ts
import { withIntrospection } from '@api-introspect/trpc'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.meta<{ description?: string }>().create()

const appRouter = t.router({
  user: t.router({
    list: t.procedure
      .meta({ description: 'List all users' })
      .query(() => []),
    create: t.procedure
      .meta({ description: 'Create a new user' })
      .input(z.object({ name: z.string() }))
      .mutation(({ input }) => input),
  }),
})

const rootRouter = withIntrospection(t, appRouter, {
  meta: {
    name: 'My API',
    description: 'User management service.'
  },
  exclude: ['admin.'],
})
```

This adds the root introspection endpoint plus path-prefix filters:

- `_introspect` -- returns metadata plus all procedures with their input/output JSON Schemas
- `_introspect.<prefix>` -- returns the same payload filtered by any dot-separated path prefix
  (for example `_introspect.user` or `_introspect.user.profile`)

The `_introspect` query returns:

```json
{
  "name": "My API",
  "description": "User management service. tRPC API...",
  "serializer": "json",
  "procedures": [
    {
      "path": "user.list",
      "type": "query",
      "description": "List all users"
    },
    {
      "path": "user.create",
      "type": "mutation",
      "description": "Create a new user",
      "input": {
        "type": "object",
        "properties": { "name": { "type": "string" } },
        "required": ["name"]
      }
    }
  ]
}
```

## API

### @api-introspect/trpc

#### `introspectRouter(router, options?)`

Low-level function.
Extracts endpoint info from a tRPC router directly.

#### `createIntrospectionRouter(t, appRouter, options?)`

Creates a tRPC router with an introspection query, ready to merge.

#### `withIntrospection(t, appRouter, options?)`

Merges the introspection router into an existing router.

#### `compactSchema(schema)`

Strips noise from a JSON Schema: removes `additionalProperties: false`, simplifies nullable `anyOf`
unions to `type: [X, "null"]`, strips verbose date metadata, and removes meaningless
`maximum: 9007199254740991`.
Applied automatically to introspection output, but also available as a
standalone utility.

#### Options

| Option       | Type         | Default         | Description                                                                                               |
| ------------ | ------------ | --------------- | --------------------------------------------------------------------------------------------------------- |
| `enabled`    | `boolean`    | `true`          | Disable the introspection endpoint entirely                                                               |
| `include`    | `string[]`   | `[]`            | Path prefixes to include (only matching paths are returned; empty means include all)                      |
| `exclude`    | `string[]`   | `[]`            | Path prefixes to exclude (e.g. `admin.`)                                                                  |
| `meta`       | `object`     | `undefined`     | Extra metadata to merge into the response; `meta.description` is appended after the generated description |
| `path`       | `string`     | `'_introspect'` | Procedure path for the introspection query                                                                |
| `serializer` | `Serializer` | auto-detected   | Override serializer detection (`'json'`, `'superjson'`, `'custom'`)                                       |

### api-introspect (Client)

```ts
import { callProcedure, fetchIntrospection } from 'api-introspect'

const introspection = await fetchIntrospection('http://localhost:3000')
const result = await callProcedure('http://localhost:3000', 'user.getById', {
  input: { id: 1 },
  introspection,
})
```

## CLI

```bash
# Install globally
npm install -g api-introspect

# List all procedures (always start here)
api-introspect <base-url>

# Filter by prefix
api-introspect <base-url> user

# Filter by multiple prefixes
api-introspect <base-url> user,post

# Call a query
api-introspect <base-url> user.getById '{"id":1}'

# Call a mutation
api-introspect <base-url> user.create '{"name":"Alice"}'

# Custom headers
api-introspect <base-url> -H "Authorization:Bearer token123"

# Force summary or full JSON output
api-introspect <base-url> --summary
api-introspect <base-url> --full
```

When listing procedures, the CLI auto-selects a summary format for routers with more than 10
procedures.
Use `--summary` or `--full` to override.

## EndpointInfo

| Field         | Type                                      | Description                                    |
| ------------- | ----------------------------------------- | ---------------------------------------------- |
| `path`        | `string`                                  | Dot-separated procedure path                   |
| `type`        | `'query' \| 'mutation' \| 'subscription'` | Procedure type                                 |
| `description` | `string \| undefined`                     | From procedure meta, if set                    |
| `input`       | `Record<string, unknown> \| undefined`    | JSON Schema of the input, via `z.toJSONSchema` |
| `output`      | `Record<string, unknown> \| undefined`    | JSON Schema of the output, if declared         |

## Example

```bash
pnpm dev
# Server running on http://localhost:3000
# curl http://localhost:3000/_introspect
```

See [examples/trpc/server.ts](./examples/trpc/server.ts) for a full example with queries and
mutations.

## Development

```bash
pnpm dev       # run the example server in watch mode
pnpm build     # build all packages
pnpm test      # run all tests
pnpm lint:fix  # lint
```

## Changelog

- 0.8.0: **Breaking:** Restructure as monorepo with `@api-introspect/core`, `@api-introspect/trpc`,
  `@api-introspect/fastify` (scaffold), and `api-introspect` (CLI).
  Rename CLI from
  `trpc-introspect` to `api-introspect`.
  Extract framework-agnostic types and utilities into core
  package.
  The old `trpc-introspect` npm package is deprecated.
- 0.7.1: Fix TS2742 error for consumers by bundling DTS per entry point.
- 0.7.0: Add `compactSchema` export that strips noise from JSON Schema output.
- 0.6.0: Add `--summary` and `--full` CLI flags for output format control.
- 0.5.0: Add client module and CLI for discovering and invoking procedures from the terminal.
- 0.4.0: **Breaking:** Remove `addIntrospectionEndpoint` (use `withIntrospection` instead).
- 0.3.0: Strongly type `meta` option.
  Highlight procedure `description` via `.meta()`.
- 0.2.0: Add `include` option to filter introspection to specific path prefixes.
- 0.1.0: Initial release with core functionality and example server.

## License

MIT
