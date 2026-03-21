import type { IntrospectionResult } from '@api-introspect/core'

export function formatSummary(introspection: IntrospectionResult): string {
  const procedures = introspection.procedures ?? []
  const lines: string[] = []

  if (introspection.name)
    lines.push(introspection.name)
  lines.push('')
  lines.push(`${procedures.length} procedures:`)
  lines.push('')

  const maxTypeLen = Math.max(...procedures.map(p => p.type.length))
  for (const p of procedures) {
    const desc = p.description ? `  # ${p.description}` : ''
    lines.push(`  ${p.type.padEnd(maxTypeLen)}  ${p.path}${desc}`)
  }

  lines.push('')
  lines.push('Use a path prefix to see full schemas:')
  lines.push('  api-introspect <url> <prefix>')
  lines.push('  api-introspect <url> <prefix1>,<prefix2>')

  return lines.join('\n')
}
