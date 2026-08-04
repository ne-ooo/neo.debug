import { afterEach, describe, expect, it } from 'vitest'
import debug from '../../src/index.node.js'

describe('node public factory', () => {
  afterEach(() => {
    debug.disable()
  })

  it('uses the same enabled state as debugger instances', () => {
    debug.enable('app:*')
    expect(debug.enabled('app:db')).toBe(true)
    expect(debug('app:db').enabled).toBe(true)

    debug.disable()
    expect(debug.enabled('app:db')).toBe(false)
    expect(debug('app:db').enabled).toBe(false)
  })
})
