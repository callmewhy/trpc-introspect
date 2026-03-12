import type { Server } from 'node:http'

import { initTRPC } from '@trpc/server'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { withIntrospection } from '../src'
import { callProcedure, fetchIntrospection } from '../src/client'

let server: Server
let baseUrl: string

beforeAll(async () => {
  const t = initTRPC.create()

  const appRouter = t.router({
    user: t.router({
      list: t.procedure
        .output(z.array(z.object({ id: z.number(), name: z.string() })))
        .query(() => [{ id: 1, name: 'Alice' }]),
      getById: t.procedure
        .input(z.object({ id: z.number() }))
        .query(({ input }) => {
          const user = [{ id: 1, name: 'Alice' }].find(u => u.id === input.id)
          if (!user) throw new Error('Not found')
          return user
        }),
      create: t.procedure
        .input(z.object({ name: z.string() }))
        .mutation(({ input }) => ({ id: 2, name: input.name })),
    }),
    health: t.router({
      check: t.procedure.query(() => ({ status: 'ok' })),
    }),
  })

  const rootRouter = withIntrospection(t, appRouter, {
    meta: { name: 'Client Test API' },
  })

  server = createHTTPServer({ router: rootRouter }).listen(0)
  const addr = server.address()
  const port = typeof addr === 'object' && addr ? addr.port : 0
  baseUrl = `http://localhost:${port}`
})

afterAll(() => {
  server?.close()
})

describe('fetchIntrospection', () => {
  it('fetches full introspection from base URL', async () => {
    const result = await fetchIntrospection(baseUrl)

    expect(result.name).toBe('Client Test API')
    expect(result.serializer).toBe('json')

    const paths = result.procedures.map(p => p.path)
    expect(paths).toContain('user.list')
    expect(paths).toContain('user.create')
    expect(paths).toContain('health.check')
  })

  it('fetches filtered introspection with filter option', async () => {
    const result = await fetchIntrospection(baseUrl, { filter: 'user' })

    expect(result.pathFilter).toBe('user')
    const paths = result.procedures.map(p => p.path)
    expect(paths).toContain('user.list')
    expect(paths).not.toContain('health.check')
  })

  it('passes custom headers', async () => {
    const result = await fetchIntrospection(baseUrl, {
      headers: { 'X-Custom': 'test' },
    })
    expect(result.procedures.length).toBeGreaterThan(0)
  })
})

describe('callProcedure', () => {
  it('calls a query with no input (auto-detects type)', async () => {
    const result = await callProcedure(baseUrl, 'user.list')
    expect(result).toEqual([{ id: 1, name: 'Alice' }])
  })

  it('calls a query with input', async () => {
    const result = await callProcedure(baseUrl, 'user.getById', {
      input: { id: 1 },
    })
    expect(result).toEqual({ id: 1, name: 'Alice' })
  })

  it('calls a mutation (auto-detects type)', async () => {
    const result = await callProcedure(baseUrl, 'user.create', {
      input: { name: 'Bob' },
    })
    expect(result).toEqual({ id: 2, name: 'Bob' })
  })

  it('calls with explicit type to skip introspection', async () => {
    const result = await callProcedure(baseUrl, 'health.check', {
      type: 'query',
      transformer: 'json',
    })
    expect(result).toEqual({ status: 'ok' })
  })

  it('accepts pre-fetched introspection to avoid extra round-trip', async () => {
    const introspection = await fetchIntrospection(baseUrl)
    const result = await callProcedure(baseUrl, 'user.list', { introspection })
    expect(result).toEqual([{ id: 1, name: 'Alice' }])
  })

  it('throws on unknown procedure', async () => {
    await expect(
      callProcedure(baseUrl, 'nonexistent'),
    ).rejects.toThrow('Procedure "nonexistent" not found')
  })

  it('supports custom transformer', async () => {
    const result = await callProcedure(baseUrl, 'health.check', {
      type: 'query',
      transformer: {
        serialize: v => v,
        deserialize: v => v,
      },
    })
    expect(result).toEqual({ status: 'ok' })
  })
})
