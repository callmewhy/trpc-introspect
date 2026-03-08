import type { AnyTRPCRouter } from '@trpc/server'
import type { z } from 'zod'

/* eslint-disable ts/no-explicit-any */
export function mockRouter(procedures: Record<string, unknown>) {
  return { _def: { procedures, _config: {} } } as unknown as AnyTRPCRouter & { _def: { procedures: Record<string, unknown> } }
}

export function mockT() {
  const flattenRouter = (defs: Record<string, unknown>): Record<string, unknown> => {
    const flat: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(defs)) {
      if (value && typeof value === 'object' && '_def' in value && 'procedures' in (value as any)._def) {
        const nested = (value as { _def: { procedures: Record<string, unknown> } })._def.procedures
        for (const [nk, nv] of Object.entries(nested)) {
          flat[`${key}.${nk}`] = nv
        }
      } else {
        flat[key] = value
      }
    }
    return flat
  }

  return {
    procedure: {
      query: (resolver: () => unknown) => ({ _type: 'query', resolver, _def: { resolver } }),
    },
    router: (defs: Record<string, unknown>) => ({ _def: { procedures: flattenRouter(defs) } }),
    mergeRouters: (...routers: Array<{ _def: { procedures: Record<string, unknown> } }>) => ({
      _def: {
        procedures: Object.assign({}, ...routers.map(r => r._def.procedures)),
      },
    }),
  } as any
}
/* eslint-enable ts/no-explicit-any */

export function mockProcedure(opts: {
  type: 'query' | 'mutation' | 'subscription'
  input?: z.ZodType
  output?: z.ZodType
  description?: string
}) {
  return {
    _def: {
      type: opts.type,
      inputs: opts.input ? [opts.input] : [],
      output: opts.output,
      meta: opts.description ? { description: opts.description } : undefined,
    },
  }
}

export function getResolver(
  router: { _def: { procedures: Record<string, unknown> } },
  path: string,
) {
  return (
    router._def.procedures[path] as {
      _def: { resolver: () => unknown }
    }
  )._def.resolver
}
