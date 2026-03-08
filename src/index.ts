import { z } from 'zod'

export interface EndpointInfo {
  path: string
  type: 'query' | 'mutation'
  description: string | undefined
  input: Record<string, unknown> | undefined
}

export interface IntrospectOptions {
  exclude?: string[]
}

interface RouterLike {
  _def: { procedures: Record<string, any> }
}

interface TRPCBuilderLike {
  procedure: { query: Function }
  router: (procedures: Record<string, any>) => any
}

export function introspectRouter(
  router: RouterLike,
  options?: IntrospectOptions,
): EndpointInfo[] {
  const { procedures } = router._def
  const excludePrefixes = options?.exclude ?? []
  const endpoints: EndpointInfo[] = []

  for (const [path, procedure] of Object.entries(procedures)) {
    if (excludePrefixes.some(prefix => path.startsWith(prefix))) {
      continue
    }

    const def = (procedure as any)._def
    const inputSchema = def.inputs?.[0]

    let input: Record<string, unknown> | undefined
    if (inputSchema) {
      try {
        const jsonSchema = z.toJSONSchema(inputSchema, { unrepresentable: 'any' })
        const { $schema: _, ...rest } = jsonSchema as Record<string, unknown>
        input = rest
      }
      catch {
        input = undefined
      }
    }

    endpoints.push({
      path,
      type: def.type as 'query' | 'mutation',
      description: def.meta?.description,
      input,
    })
  }

  return endpoints
}

/**
 * Creates a tRPC router with an introspection query procedure.
 *
 * @example
 * ```ts
 * const appRouter = t.router({ ... })
 * const rootRouter = t.mergeRouters(
 *   appRouter,
 *   createIntrospectionRouter(t, appRouter),
 * )
 * ```
 */
export function createIntrospectionRouter(
  t: TRPCBuilderLike,
  appRouter: RouterLike,
  options?: IntrospectOptions & { path?: string },
) {
  const { path = '_introspect', ...introspectOptions } = options ?? {}

  return t.router({
    [path]: t.procedure.query(() => {
      return introspectRouter(appRouter, introspectOptions)
    }),
  })
}
