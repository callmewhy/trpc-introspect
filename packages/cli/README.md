# api-introspect

CLI and HTTP client for discovering and calling API procedures via introspection.

## Install

```bash
npm install -g api-introspect
```

## CLI Usage

```bash
# List all procedures
api-introspect http://localhost:3000

# Filter by prefix
api-introspect http://localhost:3000 user

# Filter by multiple prefixes
api-introspect http://localhost:3000 user,post

# Call a TRPC query
api-introspect http://localhost:3000 user.getById '{"id":1}'

# Call a TRPC mutation
api-introspect http://localhost:3000 user.create '{"name":"Alice"}'

# Call a HTTP endpoint
api-introspect http://localhost:3001 '/user/:id' '{"id":1}'

# With auth header
api-introspect http://localhost:3000 -H "Authorization:Bearer token"

# Force output format
api-introspect http://localhost:3000 --summary
api-introspect http://localhost:3000 --full
```

### Options

| Flag                       | Description                |
| -------------------------- | -------------------------- |
| `-H, --header <key:value>` | Custom header (repeatable) |
| `--summary`                | Force summary format       |
| `--full`                   | Force full JSON output     |
| `-h, --help`               | Show help                  |

Output auto-selects summary format when there are more than 10 procedures.

## Programmatic API

```typescript
import { callProcedure, fetchIntrospection } from 'api-introspect'

// Discover endpoints
const result = await fetchIntrospection('http://localhost:3000', {
  filter: 'user', // Optional prefix filter
  headers: { Authorization: 'Bearer ...' }, // Optional headers
})

// Call a procedure
const data = await callProcedure('http://localhost:3000', 'user.getById', {
  input: { id: 1 },
  headers: { Authorization: 'Bearer ...' },
})

// Call a HTTP endpoint
const user = await callProcedure('http://localhost:3001', '/user/:id', {
  input: { id: 1 },
})
```

### `fetchIntrospection(baseUrl, options?)`

Fetches introspection metadata from a server.

| Option    | Type                     | Description                                            |
| --------- | ------------------------ | ------------------------------------------------------ |
| `path`    | `string`                 | Introspection endpoint path (default: `'_introspect'`) |
| `filter`  | `string`                 | Path prefix for server-side filtering                  |
| `headers` | `Record<string, string>` | Custom HTTP headers                                    |

### `callProcedure(baseUrl, procedure, options?)`

Calls a tRPC procedure or REST endpoint.

| Option          | Type                                       | Description                                         |
| --------------- | ------------------------------------------ | --------------------------------------------------- |
| `type`          | `'query' \| 'mutation'`                    | Procedure type (auto-detected if omitted)           |
| `input`         | `unknown`                                  | Input data                                          |
| `transformer`   | `'json' \| 'superjson' \| TransformerLike` | Wire format (auto-detected)                         |
| `headers`       | `Record<string, string>`                   | Custom HTTP headers                                 |
| `introspection` | `IntrospectionResult`                      | Pre-fetched introspection (avoids extra round-trip) |

## License

MIT
