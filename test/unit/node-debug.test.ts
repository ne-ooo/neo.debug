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

  it('invalidates cached enabled state when patterns change', () => {
    const debug = createDebug('cache:worker')

    expect(debug.enabled).toBe(false)
    debug('disabled')

    enable('cache:*')
    expect(debug.enabled).toBe(true)
    debug('enabled')

    enable('other:*')
    expect(debug.enabled).toBe(false)
    debug('disabled again')

    expect(stderrSpy).toHaveBeenCalledTimes(1)
  })

  it('supports per-instance enabled overrides', () => {
    const debug = createDebug('override:test')

    debug.enabled = true
    debug('forced on')

    enable('override:*')
    debug.enabled = false
    debug('forced off')

    expect(stderrSpy).toHaveBeenCalledTimes(1)
  })

  it('neutralizes terminal controls and attributes every output line', () => {
    enable('*')
    const debug = createDebug('api\nadmin\u001b[2J\u202e')

    debug('user=%s\nadmin auth=success\u001b[2J\u202e', 'mallory\rroot')

    const output = String(stderrSpy.mock.calls[0]?.[0])
    expect(output).toBe(
      'api\\nadmin\\x1b[2J\\u202e ' +
        'user=mallory\\rroot\\nadmin auth=success\\x1b[2J\\u202e\n'
    )
    expect(output).not.toContain('\u001b')
    expect(output).not.toContain('\r')
    expect(output.split('\n')).toHaveLength(2)
  })

  it('neutralizes all Unicode bidirectional controls', () => {
    const bidiControls =
      '\u061c\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2066\u2067\u2068\u2069'
    enable('bidi')
    const debug = createDebug('bidi')

    debug('value=%s', bidiControls)

    const output = String(stderrSpy.mock.calls[0]?.[0])
    for (const control of bidiControls) {
      expect(output).not.toContain(control)
    }
    expect(output).toContain(
      '\\u061c\\u200e\\u200f\\u202a\\u202b\\u202c' +
        '\\u202d\\u202e\\u2066\\u2067\\u2068\\u2069'
    )
  })

  it('drops messages until stderr drains after backpressure', () => {
    const conversion = vi.fn(() => 'dropped value')
    stderrSpy.mockReturnValueOnce(false)
    enable('backpressure')
    const debug = createDebug('backpressure')

    debug('queued')
    debug('dropped %s', { toString: conversion })
    debug('dropped two')

    expect(stderrSpy).toHaveBeenCalledTimes(1)
    expect(conversion).not.toHaveBeenCalled()

    process.stderr.emit('drain')
    expect(stderrSpy).toHaveBeenCalledTimes(2)
    expect(String(stderrSpy.mock.calls[1]?.[0])).toContain('dropped 2 messages')

    debug('after drain')
    expect(stderrSpy).toHaveBeenCalledTimes(3)
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

  it('keeps timing independent between debugger instances', () => {
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(1_010)
    enable('shared')
    const first = createDebug('shared')
    const second = createDebug('shared')

    first('first instance')
    second('second instance first call')

    const secondOutput = String(stderrSpy.mock.calls[1]?.[0])
    expect(secondOutput).not.toContain('+10ms')
    nowSpy.mockRestore()
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

  it('persists enable state and returns it from disable()', () => {
    enable('persist:*,-persist:secret')
    expect(process.env['DEBUG']).toBe('persist:*,-persist:secret')

    expect(disable()).toBe('persist:*,-persist:secret')
    expect(process.env['DEBUG']).toBeUndefined()
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
