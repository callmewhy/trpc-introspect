export type JSONSchema = Record<string, unknown>

export type ProcedureType = 'query' | 'mutation' | 'subscription'

export interface EndpointInfo {
  path: string
  type: ProcedureType
  description?: string
  input?: JSONSchema
  output?: JSONSchema
}

export interface IntrospectOptions {
  include?: readonly string[]
  exclude?: readonly string[]
}

export type Serializer = 'json' | 'superjson' | 'custom'

export interface IntrospectionResult {
  name?: string
  description: string
  serializer: Serializer
  pathFilter?: string
  procedures: EndpointInfo[]
}
