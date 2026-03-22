import { introspection } from '@api-introspect/fastify'
import Fastify from 'fastify'

import { healthRoutes, userRoutes } from './routes'

async function main() {
  const app = Fastify()

  await app.register(introspection, {
    meta: { name: 'Example API' },
  })

  app.register(userRoutes, { prefix: '/user' })
  app.register(healthRoutes, { prefix: '/health' })

  await app.listen({ port: 3001 })
  console.log('Server running on http://localhost:3001')
  console.log('Try: curl http://localhost:3001/_introspect')
}

main()
