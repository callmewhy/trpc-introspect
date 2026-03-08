import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { createIntrospectionRouter, introspectRouter } from '../src'

function mockRouter(procedures: Record<string, unknown>) {
  return { _def: { procedures } }
}

function mockProcedure(opts: {
  type: 'query' | 'mutation'
  input?: z.ZodType
  description?: string
}) {
  return {
    _def: {
      type: opts.type,
      inputs: opts.input ? [opts.input] : [],
      meta: opts.description ? { description: opts.description } : undefined,
    },
  }
}

describe('introspectRouter', () => {
  it('extracts basic query and mutation', () => {
    const router = mockRouter({
      'user.list': mockProcedure({ type: 'query' }),
      'user.create': mockProcedure({ type: 'mutation' }),
    })

    const result = introspectRouter(router)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      path: 'user.list',
      type: 'query',
      description: undefined,
      input: undefined,
    })
    expect(result[1]).toEqual({
      path: 'user.create',
      type: 'mutation',
      description: undefined,
      input: undefined,
    })
  })

  it('extracts description from meta', () => {
    const router = mockRouter({
      'user.get': mockProcedure({
        type: 'query',
        description: 'Get a user by ID',
      }),
    })

    const result = introspectRouter(router)

    expect(result[0]?.description).toBe('Get a user by ID')
  })

  it('converts input schema to JSON schema', () => {
    const router = mockRouter({
      'user.create': mockProcedure({
        type: 'mutation',
        input: z.object({
          name: z.string(),
          age: z.number(),
        }),
      }),
    })

    const result = introspectRouter(router)

    expect(result[0]?.input).toBeDefined()
    expect(result[0]?.input?.type).toBe('object')
    const properties = result[0]?.input?.properties as Record<string, { type: string }>
    expect(properties.name.type).toBe('string')
    expect(properties.age.type).toBe('number')
  })

  it('handles z.coerce.date() with fallback', () => {
    const router = mockRouter({
      'event.create': mockProcedure({
        type: 'mutation',
        input: z.object({
          date: z.coerce.date(),
        }),
      }),
    })

    const result = introspectRouter(router)

    expect(result[0]?.input).toBeDefined()
    const properties = result[0]?.input?.properties as Record<string, unknown>
    // z.coerce.date() is unrepresentable, falls back to {} with 'any' option
    expect(properties.date).toEqual({})
  })

  it('handles .refine() schemas', () => {
    const router = mockRouter({
      'user.update': mockProcedure({
        type: 'mutation',
        input: z
          .object({
            password: z.string(),
            confirm: z.string(),
          })
          .refine(data => data.password === data.confirm),
      }),
    })

    const result = introspectRouter(router)

    expect(result[0]?.input).toBeDefined()
    expect(result[0]?.input?.type).toBe('object')
  })

  it('excludes paths matching prefixes', () => {
    const router = mockRouter({
      'admin.stats': mockProcedure({ type: 'query' }),
      'chat.send': mockProcedure({ type: 'mutation' }),
      'user.list': mockProcedure({ type: 'query' }),
    })

    const result = introspectRouter(router, {
      exclude: ['admin.', 'chat.'],
    })

    expect(result).toHaveLength(1)
    expect(result[0]?.path).toBe('user.list')
  })

  it('returns undefined input for procedures with no input', () => {
    const router = mockRouter({
      'health.check': mockProcedure({ type: 'query' }),
    })

    const result = introspectRouter(router)

    expect(result[0]?.input).toBeUndefined()
  })

  it('returns all endpoints when no exclude option is provided', () => {
    const router = mockRouter({
      'admin.stats': mockProcedure({ type: 'query' }),
      'user.list': mockProcedure({ type: 'query' }),
    })

    const result = introspectRouter(router)

    expect(result).toHaveLength(2)
  })
})

describe('createIntrospectionRouter', () => {
  it('creates a router with _introspect procedure by default', () => {
    const appRouter = mockRouter({
      'user.list': mockProcedure({ type: 'query' }),
    })

    let capturedResolver: (() => unknown) | undefined
    const mockT = {
      procedure: {
        query: (resolver: () => unknown) => {
          capturedResolver = resolver
          return { _type: 'query', resolver }
        },
      },
      router: (procedures: Record<string, unknown>) => ({ _def: { procedures } }),
    }

    const result = createIntrospectionRouter(mockT, appRouter)

    expect(result._def.procedures).toHaveProperty('_introspect')
    expect(capturedResolver).toBeDefined()

    const endpoints = capturedResolver!()
    expect(endpoints).toHaveLength(1)
    expect(endpoints).toEqual([
      expect.objectContaining({ path: 'user.list', type: 'query' }),
    ])
  })

  it('uses custom path', () => {
    const appRouter = mockRouter({})
    const mockT = {
      procedure: { query: (r: () => unknown) => ({ _type: 'query', resolver: r }) },
      router: (procedures: Record<string, unknown>) => ({ _def: { procedures } }),
    }

    const result = createIntrospectionRouter(mockT, appRouter, { path: 'schema' })

    expect(result._def.procedures).toHaveProperty('schema')
    expect(result._def.procedures).not.toHaveProperty('_introspect')
  })

  it('passes exclude option through', () => {
    const appRouter = mockRouter({
      'admin.stats': mockProcedure({ type: 'query' }),
      'user.list': mockProcedure({ type: 'query' }),
    })

    let capturedResolver: (() => unknown) | undefined
    const mockT = {
      procedure: {
        query: (resolver: () => unknown) => {
          capturedResolver = resolver
          return { _type: 'query', resolver }
        },
      },
      router: (procedures: Record<string, unknown>) => ({ _def: { procedures } }),
    }

    createIntrospectionRouter(mockT, appRouter, { exclude: ['admin.'] })

    const endpoints = capturedResolver!() as { path: string }[]
    expect(endpoints).toHaveLength(1)
    expect(endpoints[0]?.path).toBe('user.list')
  })
})
