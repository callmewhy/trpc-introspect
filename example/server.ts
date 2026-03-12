import { createHTTPServer } from '@trpc/server/adapters/standalone'

import { createContext } from './context'
import { exampleRouter } from './router'

const server = createHTTPServer({ router: exampleRouter, createContext })

server.listen(3000)
console.log('Server running on http://localhost:3000')
console.log('Try: curl http://localhost:3000/_introspect')
