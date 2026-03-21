import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'

import { withIntrospection } from '../src'

describe('withIntrospection', () => {
  let app: ReturnType<typeof Fastify>

  afterEach(async () => {
    await app?.close()
  })

  it('registers introspection endpoint', async () => {
    app = Fastify()
    withIntrospection(app, { meta: { name: 'Test API' } })
    app.get('/test', async () => 'ok')

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    const body = JSON.parse(response.body)

    expect(response.statusCode).toBe(200)
    expect(body.name).toBe('Test API')
    expect(body.serializer).toBe('json')
    expect(body.procedures).toHaveLength(1)
    expect(body.procedures[0].path).toBe('GET /test')
    expect(body.procedures[0].type).toBe('query')
  })

  it('captures routes registered via plugins', async () => {
    app = Fastify()
    withIntrospection(app)

    app.register(async (fastify) => {
      fastify.get('/', async () => 'list')
      fastify.post('/', async () => 'create')
    }, { prefix: '/users' })

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    const body = JSON.parse(response.body)

    expect(body.procedures).toHaveLength(2)
    expect(body.procedures[0].path).toBe('GET /users')
    expect(body.procedures[1].path).toBe('POST /users')
  })

  it('extracts schemas from routes', async () => {
    app = Fastify()
    withIntrospection(app)

    app.post('/users', {
      schema: {
        description: 'Create a user',
        body: {
          type: 'object',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        response: {
          201: {
            type: 'object',
            properties: { id: { type: 'number' }, name: { type: 'string' } },
          },
        },
      },
    }, async () => ({}))

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    const body = JSON.parse(response.body)

    const proc = body.procedures[0]
    expect(proc.description).toBe('Create a user')
    expect(proc.input.properties.name.type).toBe('string')
    expect(proc.output.properties.id.type).toBe('number')
  })

  it('skips HEAD routes', async () => {
    app = Fastify()
    withIntrospection(app)
    app.get('/test', async () => 'ok')

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    const body = JSON.parse(response.body)

    const paths = body.procedures.map((p: { path: string }) => p.path)
    expect(paths).not.toContain('HEAD /test')
    expect(paths).toContain('GET /test')
  })

  it('does not include introspection route itself', async () => {
    app = Fastify()
    withIntrospection(app)
    app.get('/test', async () => 'ok')

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    const body = JSON.parse(response.body)

    const paths = body.procedures.map((p: { path: string }) => p.path)
    expect(paths).not.toContain('GET /_introspect')
  })

  it('uses custom path', async () => {
    app = Fastify()
    withIntrospection(app, { path: '/api/docs' })
    app.get('/test', async () => 'ok')

    const response = await app.inject({ method: 'GET', url: '/api/docs' })
    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)
    expect(body.procedures).toHaveLength(1)
  })

  it('does nothing when disabled', async () => {
    app = Fastify()
    withIntrospection(app, { enabled: false })
    app.get('/test', async () => 'ok')

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    expect(response.statusCode).toBe(404)
  })

  it('includes description from meta', async () => {
    app = Fastify()
    withIntrospection(app, { meta: { description: 'My custom API' } })

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    const body = JSON.parse(response.body)

    expect(body.description).toContain('Fastify REST API')
    expect(body.description).toContain('My custom API')
  })

  it('applies include filter', async () => {
    app = Fastify()
    withIntrospection(app, { include: ['/api'] })
    app.get('/api/users', async () => [])
    app.get('/health', async () => 'ok')

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    const body = JSON.parse(response.body)

    expect(body.procedures).toHaveLength(1)
    expect(body.procedures[0].path).toBe('GET /api/users')
  })

  it('applies exclude filter', async () => {
    app = Fastify()
    withIntrospection(app, { exclude: ['/health'] })
    app.get('/api/users', async () => [])
    app.get('/health', async () => 'ok')

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    const body = JSON.parse(response.body)

    expect(body.procedures).toHaveLength(1)
    expect(body.procedures[0].path).toBe('GET /api/users')
  })

  it('sets custom serializer', async () => {
    app = Fastify()
    withIntrospection(app, { serializer: 'superjson' })

    const response = await app.inject({ method: 'GET', url: '/_introspect' })
    const body = JSON.parse(response.body)

    expect(body.serializer).toBe('superjson')
  })
})
