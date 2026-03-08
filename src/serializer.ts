import type { Serializer } from './types'

/* eslint-disable ts/no-explicit-any */
export function detectSerializer(config: unknown): Serializer {
  if (!isRecord(config))
    return 'json'

  const transformer = (config as Record<string, any>).transformer
  if (!transformer)
    return 'json'

  const serialize: unknown
    = typeof transformer.serialize === 'function'
      ? transformer.serialize
      : typeof transformer.input?.serialize === 'function'
        ? transformer.input.serialize
        : null

  if (typeof serialize !== 'function')
    return 'json'

  try {
    const sentinel = { _: new Date(0) }
    const result = (serialize as (v: unknown) => unknown)(sentinel)
    if (result === sentinel)
      return 'json'
    if (isRecord(result) && 'json' in result)
      return 'superjson'
    return 'custom'
  }
  catch {
    return 'json'
  }
}
/* eslint-enable ts/no-explicit-any */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
