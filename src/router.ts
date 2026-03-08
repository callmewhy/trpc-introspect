import type { AnyTRPCRouter, TRPCRootObject } from '@trpc/server'
import { initTRPC } from '@trpc/server'

import { introspectRouter } from './introspect'
import { detectSerializer } from './serializer'
import type { EndpointInfo, IntrospectionResult, IntrospectionRouterOptions, Serializer } from './types'

type InitTRPCOptions = Parameters<typeof initTRPC.create>[0]
/* eslint-disable ts/no-explicit-any */
type AnyTRPCRoot = TRPCRootObject<any, any, any, any>
/* eslint-enable ts/no-explicit-any */

function generateDescription(serializer: Serializer, procedures: EndpointInfo[]): string {
  const queries = procedures.filter(p => p.type === 'query')
  const mutations = procedures.filter(p => p.type === 'mutation')
  const subscriptions = procedures.filter(p => p.type === 'subscription')

  const lines = [
    'This is a tRPC API. Use the procedures listed below to interact with it.',
    '',
    `Serializer: ${serializer}`,
    serializer === 'superjson'
      ? 'Requests and responses use SuperJSON encoding. Wrap input with { json: <data>, meta: { ... } } and unwrap responses the same way.'
      : 'Requests and responses use standard JSON encoding.',
    '',
    'To call a query: GET /<procedure_path>?input=<URL-encoded JSON>',
    'To call a mutation: POST /<procedure_path> with JSON body',
    'Response format: { "result": { "data": <value> } }',
    '',
    `Available procedures: ${queries.length} queries, ${mutations.length} mutations${subscriptions.length ? `, ${subscriptions.length} subscriptions` : ''}`,
    'See the "procedures" array for the full list with input/output JSON schemas.',
  ]

  return lines.join('\n')
}

/**
 * Creates a tRPC router with an introspection query procedure.
 *
 * The introspection payload is precomputed when this helper is called,
 * so the query stays cheap at request time.
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
  t: AnyTRPCRoot,
  appRouter: AnyTRPCRouter,
  options: IntrospectionRouterOptions = {},
) {
  const { enabled = true, path = '_introspect', meta, ...introspectOptions } = options

  if (!enabled) {
    return t.router({})
  }

  const procedures = introspectRouter(appRouter, introspectOptions)
  const serializer = options.serializer ?? detectSerializer(appRouter._def._config)

  const description = generateDescription(serializer, procedures)

  const result: IntrospectionResult = {
    ...meta,
    description,
    serializer,
    procedures,
  }

  const baseRouter = t.router({
    [path]: t.procedure.query(() => result),
  })

  // Build namespace sub-routes so e.g. /_introspect/user returns only user.* procedures
  const namespaces = [...new Set(
    procedures
      .map(p => p.path.split('.')[0])
      .filter((ns): ns is string => !!ns),
  )]

  if (namespaces.length === 0) {
    return baseRouter
  }

  const namespaceEntries = Object.fromEntries(
    namespaces.map((ns) => {
      const filtered = procedures.filter(p => p.path.startsWith(`${ns}.`))
      const nsResult: IntrospectionResult = {
        ...meta,
        description: generateDescription(serializer, filtered),
        serializer,
        procedures: filtered,
      }
      return [ns, t.procedure.query(() => nsResult)]
    }),
  )

  const nsRouter = t.router({
    [path]: t.router(namespaceEntries),
  })

  return t.mergeRouters(baseRouter, nsRouter)
}

export function withIntrospection<TRouter extends AnyTRPCRouter>(
  t: AnyTRPCRoot,
  appRouter: TRouter,
  options: IntrospectionRouterOptions = {},
) {
  return t.mergeRouters(
    appRouter,
    createIntrospectionRouter(t, appRouter, options),
  )
}

export function addIntrospectionEndpoint<TRouter extends AnyTRPCRouter>(
  router: TRouter,
  options: IntrospectionRouterOptions = {},
) {
  const runtimeConfig = { ...(router._def._config as InitTRPCOptions & { $types?: unknown }) }
  delete runtimeConfig.$types

  const t = initTRPC.create(runtimeConfig)

  return withIntrospection(t, router, options)
}
