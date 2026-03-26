import type { IntrospectionResult } from '@api-introspect/core'

export function formatSummary(introspection: IntrospectionResult): string {
  const items = introspection.endpoints ?? introspection.procedures ?? []
  const noun = introspection.endpoints ? 'endpoints' : 'procedures'
  const lines: string[] = []

  if (introspection.name)
    lines.push(introspection.name)
  lines.push('')
  lines.push(`${items.length} ${noun}:`)
  lines.push('')

  const label = (p: { type: string, method?: string }) => p.type === 'http' ? p.method ?? '' : p.type
  const maxLabelLen = Math.max(...items.map(p => label(p).length))
  for (const p of items) {
    const desc = p.description ? `  # ${p.description}` : ''
    lines.push(`  ${label(p).padEnd(maxLabelLen)}  ${p.path}${desc}`)
  }

  return lines.join('\n')
}
