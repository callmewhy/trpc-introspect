import type { AnyTRPCRouter } from '@trpc/server'
import { describe, expect, it } from 'vitest'

import type { IntrospectionResult } from '../src'
import { createIntrospectionRouter } from '../src'
import { getResolver, mockRouter, mockT } from './helpers'

describe('serializer detection', () => {
  it('defaults to json serializer', () => {
    const result = createIntrospectionRouter(mockT(), mockRouter({}))
    const data = getResolver(result, '_introspect')() as IntrospectionResult

    expect(data.serializer).toBe('json')
  })

  it('detects superjson transformer from config', () => {
    const appRouter = {
      _def: {
        procedures: {},
        _config: {
          transformer: {
            serialize: (v: unknown) => ({ json: v, meta: {} }),
            deserialize: (v: unknown) => v,
          },
        },
      },
    } as unknown as AnyTRPCRouter

    const result = createIntrospectionRouter(mockT(), appRouter)
    const data = getResolver(result, '_introspect')() as IntrospectionResult

    expect(data.serializer).toBe('superjson')
  })

  it('allows manual serializer override', () => {
    const result = createIntrospectionRouter(mockT(), mockRouter({}), { serializer: 'superjson' })
    const data = getResolver(result, '_introspect')() as IntrospectionResult

    expect(data.serializer).toBe('superjson')
  })
})

describe('meta fields', () => {
  it('includes user-provided meta in the response', () => {
    const result = createIntrospectionRouter(mockT(), mockRouter({}), {
      meta: { name: 'My API' },
    })
    const data = getResolver(result, '_introspect')() as IntrospectionResult

    expect(data.name).toBe('My API')
    expect(data.description).toContain('tRPC API')
    expect(data.serializer).toBe('json')
    expect(data.procedures).toEqual([])
  })

  it('returns only serializer and procedures when no meta provided', () => {
    const result = createIntrospectionRouter(mockT(), mockRouter({}))
    const data = getResolver(result, '_introspect')() as IntrospectionResult

    expect(Object.keys(data)).toEqual(['description', 'serializer', 'procedures'])
  })
})
