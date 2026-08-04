import { afterEach, describe, expect, it, vi } from 'vitest'

describe('node optional colors', () => {
  afterEach(() => {
    vi.doUnmock('node:module')
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('uses the optional peer for namespace and timing colors', async () => {
    const color = (text: string) => `[color:${text}]`
    const gray = (text: string) => `[gray:${text}]`

    vi.doMock('node:module', () => ({
      createRequire: () => () => ({
        default: {
          cyan: color,
          magenta: color,
          blue: color,
          yellow: color,
          green: color,
          red: color,
          gray,
        },
      }),
    }))

    const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
    vi.spyOn(Date, 'now').mockReturnValueOnce(1_000).mockReturnValueOnce(1_010)
    const { createDebug, enable } = await import('../../src/env/node.js')
    enable('color:test')
    const log = createDebug('color:test')

    log('first')
    log('second')

    expect(stderrSpy.mock.calls[0]?.[0]).toContain('[color:color:test]')
    expect(stderrSpy.mock.calls[1]?.[0]).toContain('[gray:+10ms]')
  })
})
