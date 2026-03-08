import { initTRPC } from '@trpc/server'
import { createHTTPServer } from '@trpc/server/adapters/standalone'
import { z } from 'zod'

import { withIntrospection } from '../src'

const t = initTRPC.meta<{ description?: string }>().create()

// In-memory data store
const users: { id: number, name: string, email: string }[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
]

let nextId = 3

const appRouter = t.router({
  user: t.router({
    list: t.procedure
      .meta({ description: 'List all users' })
      .query(() => users),

    getById: t.procedure
      .meta({ description: 'Get a user by ID' })
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        const user = users.find(u => u.id === input.id)
        if (!user)
          throw new Error('User not found')
        return user
      }),

    create: t.procedure
      .meta({ description: 'Create a new user with name and email' })
      .input(z.object({ name: z.string(), email: z.string().email() }))
      .mutation(({ input }) => {
        const user = { id: nextId++, ...input }
        users.push(user)
        return user
      }),

    update: t.procedure
      .meta({ description: 'Update an existing user by ID' })
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(({ input }) => {
        const user = users.find(u => u.id === input.id)
        if (!user)
          throw new Error('User not found')
        if (input.name)
          user.name = input.name
        if (input.email)
          user.email = input.email
        return user
      }),

    delete: t.procedure
      .meta({ description: 'Delete a user by ID' })
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => {
        const idx = users.findIndex(u => u.id === input.id)
        if (idx === -1)
          throw new Error('User not found')
        return users.splice(idx, 1)[0]
      }),
  }),

  health: t.router({
    check: t.procedure
      .meta({ description: 'Health check' })
      .query(() => ({ status: 'ok', timestamp: Date.now() })),
  }),
})

const rootRouter = withIntrospection(t, appRouter, {
  meta: { name: 'Example API' },
})

const server = createHTTPServer({ router: rootRouter })
server.listen(3000)
console.log('Server running on http://localhost:3000')
console.log('Try: curl http://localhost:3000/_introspect')
