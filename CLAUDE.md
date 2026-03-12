# trpc-introspect

tRPC router introspection SDK. Adds a query endpoint that lists all procedures with types plus input and output schemas as JSON Schema.

## Tech Stack

- TypeScript, built with tsdown (ESM + CJS dual output)
- Zod v4 (peer dependency, uses `z.toJSONSchema`)
- Vitest for tests
- pnpm as package manager

## Project Structure

- `src/index.ts` - All SDK code (single file)
- `test/index.test.ts` - Unit tests
- `example/server.ts` - Example tRPC server using the SDK

## Key Design Decisions

- `@trpc/server` is a peer dependency. Uses real tRPC types (`AnyTRPCRouter`, `TRPCRootObject`) for type safety.
- Accesses tRPC internals (`router._def.procedures`, `procedure._def`) which are untyped. Using `any` here is intentional.
- Input and output schemas are converted to JSON Schema via `z.toJSONSchema` with `unrepresentable: 'any'`. Results are cached in a `WeakMap`.
- `z.coerce.date()` is mapped to `{ type: "string", format: "date-time", deprecated: true }` via a custom `override`.
- Introspection payload is precomputed at router creation time, not per-request.

## Exported API

- `introspectRouter(router, options?)` - Low-level: extracts `EndpointInfo[]` from a router
- `createIntrospectionRouter(t, appRouter, options?)` - Returns a tRPC router with an introspection query procedure, to be used with `t.mergeRouters()`
- `withIntrospection(t, appRouter, options?)` - Convenience: merges the introspection router into the app router in one step

## Commands

```bash
pnpm dev        # tsx example/server.ts (starts on port 3000)
pnpm test       # vitest run
pnpm build      # tsdown
pnpm lint       # eslint
pnpm lint:fix   # eslint --fix
```
