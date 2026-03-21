export function isIncludedPath(path: string, includePrefixes: readonly string[]) {
  return includePrefixes.some(prefix => path.startsWith(prefix))
}

export function isExcludedPath(path: string, excludePrefixes: readonly string[]) {
  return excludePrefixes.some(prefix => path.startsWith(prefix))
}
