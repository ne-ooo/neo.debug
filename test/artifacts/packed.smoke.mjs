import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const manifest = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'))
const stagingRoot = await mkdtemp(join(tmpdir(), 'neo-debug-package-'))
const consumerRoot = join(stagingRoot, 'consumer')
const packageDirectory = join(consumerRoot, 'node_modules', '@lpm.dev', 'neo.debug')

function runNode(script, args = []) {
  const result = spawnSync(process.execPath, [...args, script], {
    cwd: consumerRoot,
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr || result.stdout)
}

try {
  await mkdir(packageDirectory, { recursive: true })
  for (const entry of ['package.json', ...manifest.files]) {
    await cp(join(packageRoot, entry), join(packageDirectory, entry), { recursive: true })
  }

  await writeFile(join(consumerRoot, 'package.json'), '{"private":true,"type":"module"}\n')
  await writeFile(
    join(consumerRoot, 'esm.mjs'),
    "import assert from 'node:assert/strict'; import debug from '@lpm.dev/neo.debug'; assert.equal(typeof debug, 'function'); debug.enable('packed:esm'); assert.equal(debug('packed:esm').enabled, true);\n"
  )
  await writeFile(
    join(consumerRoot, 'cjs.cjs'),
    "const assert = require('node:assert/strict'); const debug = require('@lpm.dev/neo.debug'); assert.equal(typeof debug, 'function'); debug.enable('packed:cjs'); assert.equal(debug('packed:cjs').enabled, true);\n"
  )
  await writeFile(
    join(consumerRoot, 'browser.mjs'),
    "import assert from 'node:assert/strict'; globalThis.localStorage = { getItem: () => '', setItem() {}, removeItem() {} }; const calls = []; console.log = (...args) => calls.push(args); const { default: debug } = await import('@lpm.dev/neo.debug'); debug.enable('packed:browser'); debug('packed:browser')('message'); assert.equal(calls.length, 1);\n"
  )
  await writeFile(
    join(consumerRoot, 'types.ts'),
    "import debug, { type Debugger } from '@lpm.dev/neo.debug'; const log: Debugger = debug('packed:types'); log('message');\n"
  )

  runNode('esm.mjs')
  runNode('cjs.cjs')
  runNode('browser.mjs', ['--conditions=browser'])

  const typescriptBin = require.resolve('typescript/bin/tsc')
  const typecheck = spawnSync(
    process.execPath,
    [
      typescriptBin,
      '--noEmit',
      '--strict',
      '--target',
      'ES2022',
      '--module',
      'ESNext',
      '--moduleResolution',
      'bundler',
      '--skipLibCheck',
      'types.ts',
    ],
    { cwd: consumerRoot, encoding: 'utf8' }
  )
  assert.equal(typecheck.status, 0, typecheck.stderr || typecheck.stdout)
} finally {
  await rm(stagingRoot, { recursive: true, force: true })
}
