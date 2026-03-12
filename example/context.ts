import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone'

export interface Context {
  token: string | null
}

export function createContext({ req }: CreateHTTPContextOptions): Context {
  const auth = req.headers.authorization
  return { token: auth?.startsWith('Bearer ') ? auth.slice(7) : null }
}
