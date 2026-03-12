import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createDebug, enable, disable } from '../../src/env/node.js'

describe('node debug — createDebug', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    stderrSpy.mockRestore()
    disable()
    delete process.env['DEBUG']
  })

  it('returns a function with namespace, enabled, destroy properties', () => {
    const debug = createDebug('app')
    expect(typeof debug).toBe('function')
    expect(debug.namespace).toBe('app')
    expect(typeof debug.enabled).toBe('boolean')
    expect(typeof debug.destroy).toBe('function')
  })

  it('is disabled by default (no DEBUG env var)', () => {
    const debug = createDebug('app')
    debug('hello')
    expect(stderrSpy).not.toHaveBeenCalled()
  })

  it('outputs to stderr when namespace is enabled', () => {
    enable('myapp')
    const debug = createDebug('myapp')
    debug('test message')
    expect(stderrSpy).toHaveBeenCalled()
    const output = String(stderrSpy.mock.calls[0]?.[0])
    expect(output).toContain('test message')
    expect(output).toContain('myapp')
  })

  it('includes namespace in output', () => {
    enable('service:db')
    const debug = createDebug('service:db')
    debug('query executed')
    const output = String(stderrSpy.mock.calls[0]?.[0])
    expect(output).toContain('service:db')
  })

  it('outputs nothing when disabled namespace', () => {
    enable('other')
    const debug = createDebug('notthis')
    debug('should not appear')
    expect(stderrSpy).not.toHaveBeenCalled()
  })

  it('wildcard enables matching namespaces', () => {
    enable('app:*')
    const db = createDebug('app:db')
    const cache = createDebug('app:cache')
    db('db message')
    cache('cache message')
    expect(stderrSpy).toHaveBeenCalledTimes(2)
  })

  it('disable() suppresses all output', () => {
    enable('app')
    const debug = createDebug('app')
    disable()
    debug('should not appear')
    expect(stderrSpy).not.toHaveBeenCalled()
  })

  it('destroy() removes timestamp tracking', () => {
    enable('temp')
    const debug = createDebug('temp')
    debug('first')
    debug.destroy()
    // Should not throw
    expect(() => debug('after destroy')).not.toThrow()
  })

  it('second call includes time diff in output', async () => {
    enable('timing')
    const debug = createDebug('timing')
    debug('first call')
    await new Promise((r) => setTimeout(r, 10))
    debug('second call')
    // Second write should include timing
    const secondOutput = String(stderrSpy.mock.calls[1]?.[0])
    expect(secondOutput).toContain('+')
  })
})

describe('node debug — enable / disable', () => {
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    stderrSpy.mockRestore()
    disable()
  })

  it('enable() allows subsequent debuggers to log', () => {
    enable('widget')
    const debug = createDebug('widget')
    debug('hi')
    expect(stderrSpy).toHaveBeenCalled()
  })

  it('enable() with comma-separated namespaces enables all', () => {
    enable('one,two,three')
    createDebug('one')('msg one')
    createDebug('two')('msg two')
    createDebug('three')('msg three')
    expect(stderrSpy).toHaveBeenCalledTimes(3)
  })

  it('disable() after enable() stops output', () => {
    enable('abc')
    disable()
    const debug = createDebug('abc')
    debug('should not appear')
    expect(stderrSpy).not.toHaveBeenCalled()
  })

  it('excluded namespace (-prefix) is suppressed', () => {
    enable('app:*,-app:secret')
    createDebug('app:public')('visible')
    createDebug('app:secret')('hidden')
    expect(stderrSpy).toHaveBeenCalledTimes(1)
    const output = String(stderrSpy.mock.calls[0]?.[0])
    expect(output).toContain('app:public')
  })
})
