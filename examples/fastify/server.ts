import { withIntrospection } from '@api-introspect/fastify'
import Fastify from 'fastify'

import { healthRoutes, userRoutes } from './routes'

const app = Fastify()

withIntrospection(app, {
  meta: { name: 'Example API' },
})

app.register(userRoutes, { prefix: '/user' })
app.register(healthRoutes, { prefix: '/health' })

app.listen({ port: 3001 }).then(() => {
  console.log('Server running on http://localhost:3001')
  console.log('Try: curl http://localhost:3001/_introspect')
})
