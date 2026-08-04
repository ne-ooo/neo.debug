import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('browser debug', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => ''),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('uses the same enabled state as debugger instances', async () => {
    const { default: debug } = await import('../../src/index.browser.js')

    debug.enable('app:*')
    expect(debug.enabled('app:ui')).toBe(true)
    expect(debug('app:ui').enabled).toBe(true)

    debug.disable()
    expect(debug.enabled('app:ui')).toBe(false)
    expect(debug('app:ui').enabled).toBe(false)
  })

  it('loads initial namespace state from localStorage', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'stored:*'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { createDebug } = await import('../../src/env/browser.js')
    const log = createDebug('stored:ui')

    expect(log.enabled).toBe(true)
    log('loaded')
    expect(consoleSpy).toHaveBeenCalledOnce()
  })

  it('persists enable and disable changes', async () => {
    const { enable, disable } = await import('../../src/env/browser.js')

    enable('persist:*')
    expect(localStorage.setItem).toHaveBeenCalledWith('debug', 'persist:*')

    disable()
    expect(localStorage.removeItem).toHaveBeenCalledWith('debug')
  })

  it('works when localStorage throws and invalidates cached state', async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('storage unavailable')
      }),
      setItem: vi.fn(() => {
        throw new Error('storage unavailable')
      }),
      removeItem: vi.fn(() => {
        throw new Error('storage unavailable')
      }),
    })
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { createDebug, disable, enable } = await import('../../src/env/browser.js')
    const log = createDebug('storage:test')

    expect(log.enabled).toBe(false)
    log('disabled')

    enable('storage:*')
    expect(log.enabled).toBe(true)
    log('first')
    log.destroy()
    log('after destroy')

    disable()
    expect(log.enabled).toBe(false)
    expect(consoleSpy).toHaveBeenCalledTimes(2)
    expect(consoleSpy.mock.calls[1]?.[0]).toBe('%c%s%c %s')
  })

  it('passes namespaces and messages as console values', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(1_010)
    const { createDebug, enable } = await import('../../src/env/browser.js')
    enable('app')
    const log = createDebug('app')

    log('warmup')
    log('literal unmatched %s')

    expect(consoleSpy.mock.calls[1]).toEqual([
      '%c%s%c %s %c%s',
      'color: #cccc00; font-weight: bold',
      'app',
      'color: inherit',
      'literal unmatched %s',
      'color: gray; font-weight: normal',
      '+10ms',
    ])
  })

  it('keeps timing independent between debugger instances', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const nowSpy = vi.spyOn(Date, 'now')
    nowSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(1_010)
    const { createDebug, enable } = await import('../../src/env/browser.js')
    enable('shared')
    const first = createDebug('shared')
    const second = createDebug('shared')

    first('first instance')
    second('second instance first call')

    expect(consoleSpy.mock.calls[1]?.[0]).toBe('%c%s%c %s')
  })
})
