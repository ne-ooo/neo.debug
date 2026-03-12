import { defineConfig } from 'tsup'

export default defineConfig([
  // Node.js build (ESM + CJS)
  {
    entry: { index: 'src/index.node.ts' },
    format: ['esm', 'cjs'],
    outDir: 'dist/node',
    platform: 'node',
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
  },
  // Browser build (ESM only)
  {
    entry: { index: 'src/index.browser.ts' },
    format: ['esm'],
    outDir: 'dist/browser',
    platform: 'browser',
    dts: true,
    sourcemap: true,
    minify: false,
  },
])
