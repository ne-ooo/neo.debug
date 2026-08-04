import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const commonJsDebug = require('@lpm.dev/neo.debug')

assert.equal(typeof commonJsDebug, 'function')
assert.equal(typeof commonJsDebug.enable, 'function')
assert.equal(typeof commonJsDebug.disable, 'function')
assert.equal(typeof commonJsDebug.enabled, 'function')

commonJsDebug.enable('smoke:cjs')
assert.equal(commonJsDebug('smoke:cjs').enabled, true)
commonJsDebug.disable()

const { default: esmDebug, debug: createEsmDebug } = await import('@lpm.dev/neo.debug')

assert.equal(typeof esmDebug, 'function')
assert.equal(typeof createEsmDebug, 'function')

esmDebug.enable('smoke:esm')
assert.equal(esmDebug('smoke:esm').enabled, true)
esmDebug.disable()

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const fixtureModules = resolve(packageRoot, 'test/fixtures/modules')

function runColorSmoke(args) {
  const result = spawnSync(process.execPath, args, {
    cwd: packageRoot,
    encoding: 'utf8',
    env: { ...process.env, NODE_PATH: fixtureModules },
  })

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stderr, /\[color:color-smoke\]/)
}

runColorSmoke([
  '--input-type=module',
  '--eval',
  "import debug from './dist/node/index.js'; debug.enable('color-smoke'); debug('color-smoke')('esm')",
])

runColorSmoke([
  '--eval',
  "const debug = require('./dist/node/index.cjs'); debug.enable('color-smoke'); debug('color-smoke')('cjs')",
])
