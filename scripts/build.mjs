import { rm } from 'node:fs/promises'

import { build } from 'esbuild'

await rm(new URL('../dist', import.meta.url), { recursive: true, force: true })

const shared = {
  bundle: true,
  minify: false,
  sourcemap: true,
  target: 'es2022',
}

await Promise.all([
  build({
    ...shared,
    entryPoints: ['src/index.node.ts'],
    outfile: 'dist/node/index.js',
    format: 'esm',
    platform: 'node',
    packages: 'external',
  }),
  build({
    ...shared,
    entryPoints: ['src/index.node.ts'],
    outfile: 'dist/node/index.cjs',
    format: 'cjs',
    platform: 'node',
    packages: 'external',
    define: { 'import.meta.url': '__filename' },
    footer: {
      js: 'var cjsExports = module.exports; module.exports = Object.assign(cjsExports.default, cjsExports);',
    },
  }),
  build({
    ...shared,
    entryPoints: ['src/index.browser.ts'],
    outfile: 'dist/browser/index.js',
    format: 'esm',
    platform: 'browser',
  }),
])
