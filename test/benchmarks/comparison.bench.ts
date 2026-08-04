import { afterAll, beforeAll, bench, describe } from 'vitest'
import debugOriginal from 'debug'

import debugNeo from '../../src/index.node.js'

const originalStderrWrite = process.stderr.write
const noopWrite = () => true
const enabledPatterns = 'bench:*,-bench:disabled,app:*,-app:db'

debugOriginal.enable(enabledPatterns)
debugNeo.enable(enabledPatterns)

const originalDisabled = debugOriginal('bench:disabled')
const neoDisabled = debugNeo('bench:disabled')
const originalSimple = debugOriginal('bench:simple')
const neoSimple = debugNeo('bench:simple')
const originalPrintf = debugOriginal('bench:printf')
const neoPrintf = debugNeo('bench:printf')
const originalJson = debugOriginal('bench:json')
const neoJson = debugNeo('bench:json')
const originalWildcardMatch = debugOriginal('app:server')
const neoWildcardMatch = debugNeo('app:server')
const originalWildcardExcluded = debugOriginal('app:db')
const neoWildcardExcluded = debugNeo('app:db')
const jsonValue = { user: 'john', points: 42, active: true }

beforeAll(() => {
  process.stderr.write = noopWrite as typeof process.stderr.write
})

afterAll(() => {
  process.stderr.write = originalStderrWrite
  debugOriginal.disable()
  debugNeo.disable()
})

describe('Benchmark: neo.debug vs debug', () => {
  describe('Namespace creation only', () => {
    bench('debug (original) - create', () => {
      debugOriginal('bench:create')
    })

    bench('neo.debug - create', () => {
      debugNeo('bench:create')
    })
  })

  describe('Steady-state disabled call', () => {
    bench('debug (original) - call disabled logger', () => {
      originalDisabled('ignored')
    })

    bench('neo.debug - call disabled logger', () => {
      neoDisabled('ignored')
    })
  })

  describe('Steady-state enabled logging', () => {
    bench('debug (original) - simple call', () => {
      originalSimple('Simple message')
    })

    bench('neo.debug - simple call', () => {
      neoSimple('Simple message')
    })

    bench('debug (original) - printf call', () => {
      originalPrintf('User %s has %d points', 'john', 42)
    })

    bench('neo.debug - printf call', () => {
      neoPrintf('User %s has %d points', 'john', 42)
    })

    bench('debug (original) - JSON call', () => {
      originalJson('Data: %j', jsonValue)
    })

    bench('neo.debug - JSON call', () => {
      neoJson('Data: %j', jsonValue)
    })
  })

  describe('Steady-state wildcard filtering', () => {
    bench('debug (original) - wildcard match call', () => {
      originalWildcardMatch('Message')
    })

    bench('neo.debug - wildcard match call', () => {
      neoWildcardMatch('Message')
    })

    bench('debug (original) - wildcard excluded call', () => {
      originalWildcardExcluded('ignored')
    })

    bench('neo.debug - wildcard excluded call', () => {
      neoWildcardExcluded('ignored')
    })
  })
})
