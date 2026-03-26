import type { IntrospectionMeta, IntrospectOptions, Serializer } from '@api-introspect/core'

export interface IntrospectionPluginOptions extends IntrospectOptions {
  enabled?: boolean
  path?: string
  serializer?: Serializer
  meta?: IntrospectionMeta
}
