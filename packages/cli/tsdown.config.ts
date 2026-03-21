import { defineConfig } from 'tsdown'

const shared = {
  format: ['es', 'cjs'] as const,
  target: 'node12' as const,
  sourcemap: false as const,
  outExtensions(context: { format: string }) {
    if (context.format === 'es') {
      return { js: '.mjs' }
    }
    if (context.format === 'cjs') {
      return { js: '.cjs' }
    }
  },
}

export default defineConfig([
  {
    ...shared,
    entry: ['./src/index.ts'],
    outDir: './dist',
    dts: true,
  },
  {
    ...shared,
    entry: ['./src/cli/index.ts'],
    outDir: './dist/cli',
    dts: false,
  },
])
