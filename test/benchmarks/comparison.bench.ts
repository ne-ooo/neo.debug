import { bench, describe } from 'vitest'
import debugOriginal from 'debug'
import debugNeo from '../../src/index.node.js'

// Suppress actual output during benchmarks
const originalStderr = process.stderr.write
const noop = () => true

describe('Benchmark: neo.debug vs debug', () => {
  beforeEach(() => {
    // Suppress output
    process.stderr.write = noop as any
    // @ts-expect-error - accessing internal console
    console._stdout.write = noop
    // @ts-expect-error - accessing internal console
    console._stderr.write = noop
  })

  afterEach(() => {
    // Restore output
    process.stderr.write = originalStderr
  })

  describe('Disabled namespace (no-op)', () => {
    bench('debug (original) - disabled', () => {
      const log = debugOriginal('test:disabled')
      log('This should not output')
    })

    bench('neo.debug - disabled', () => {
      const log = debugNeo('test:disabled')
      log('This should not output')
    })
  })

  describe('Simple logging (enabled)', () => {
    beforeEach(() => {
      process.env.DEBUG = 'test:*'
      debugOriginal.enable('test:*')
      debugNeo.enable('test:*')
    })

    afterEach(() => {
      delete process.env.DEBUG
    })

    bench('debug (original) - simple', () => {
      const log = debugOriginal('test:bench')
      log('Simple message')
    })

    bench('neo.debug - simple', () => {
      const log = debugNeo('test:bench')
      log('Simple message')
    })
  })

  describe('Printf formatting (enabled)', () => {
    beforeEach(() => {
      process.env.DEBUG = 'test:*'
      debugOriginal.enable('test:*')
      debugNeo.enable('test:*')
    })

    afterEach(() => {
      delete process.env.DEBUG
    })

    bench('debug (original) - printf', () => {
      const log = debugOriginal('test:printf')
      log('User %s has %d points', 'john', 42)
    })

    bench('neo.debug - printf', () => {
      const log = debugNeo('test:printf')
      log('User %s has %d points', 'john', 42)
    })
  })

  describe('Multiple arguments (enabled)', () => {
    beforeEach(() => {
      process.env.DEBUG = 'test:*'
      debugOriginal.enable('test:*')
      debugNeo.enable('test:*')
    })

    afterEach(() => {
      delete process.env.DEBUG
    })

    bench('debug (original) - multiple args', () => {
      const log = debugOriginal('test:args')
      log('Message', 'with', 'multiple', 'arguments')
    })

    bench('neo.debug - multiple args', () => {
      const log = debugNeo('test:args')
      log('Message', 'with', 'multiple', 'arguments')
    })
  })

  describe('JSON formatting (enabled)', () => {
    beforeEach(() => {
      process.env.DEBUG = 'test:*'
      debugOriginal.enable('test:*')
      debugNeo.enable('test:*')
    })

    afterEach(() => {
      delete process.env.DEBUG
    })

    const testObj = { user: 'john', points: 42, active: true }

    bench('debug (original) - JSON', () => {
      const log = debugOriginal('test:json')
      log('Data: %j', testObj)
    })

    bench('neo.debug - JSON', () => {
      const log = debugNeo('test:json')
      log('Data: %j', testObj)
    })
  })

  describe('Namespace creation', () => {
    bench('debug (original) - create namespace', () => {
      debugOriginal('test:new:namespace')
    })

    bench('neo.debug - create namespace', () => {
      debugNeo('test:new:namespace')
    })
  })

  describe('Wildcard namespace matching', () => {
    beforeEach(() => {
      debugOriginal.enable('app:*,-app:db')
      debugNeo.enable('app:*,-app:db')
    })

    bench('debug (original) - wildcard match', () => {
      const log = debugOriginal('app:server')
      log('Message')
    })

    bench('neo.debug - wildcard match', () => {
      const log = debugNeo('app:server')
      log('Message')
    })

    bench('debug (original) - wildcard exclude', () => {
      const log = debugOriginal('app:db')
      log('Message')
    })

    bench('neo.debug - wildcard exclude', () => {
      const log = debugNeo('app:db')
      log('Message')
    })
  })
})
