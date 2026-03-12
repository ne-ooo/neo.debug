import { describe, it, expect } from 'vitest'
import { parseNamespaces, matchesPattern, isNamespaceEnabled } from '../../src/core/namespace.js'

describe('namespace matching', () => {
  describe('parseNamespaces', () => {
    it('should parse simple patterns', () => {
      const result = parseNamespaces('app')
      expect(result).toEqual({ enabled: ['app'], disabled: [] })
    })

    it('should parse wildcard patterns', () => {
      const result = parseNamespaces('app:*')
      expect(result).toEqual({ enabled: ['app:*'], disabled: [] })
    })

    it('should parse disabled patterns', () => {
      const result = parseNamespaces('-app:db')
      expect(result).toEqual({ enabled: [], disabled: ['app:db'] })
    })

    it('should parse mixed patterns', () => {
      const result = parseNamespaces('app:*,-app:db')
      expect(result).toEqual({ enabled: ['app:*'], disabled: ['app:db'] })
    })

    it('should handle space separators', () => {
      const result = parseNamespaces('app api server')
      expect(result).toEqual({ enabled: ['app', 'api', 'server'], disabled: [] })
    })

    it('should handle comma separators', () => {
      const result = parseNamespaces('app,api,server')
      expect(result).toEqual({ enabled: ['app', 'api', 'server'], disabled: [] })
    })

    it('should handle mixed separators', () => {
      const result = parseNamespaces('app, api server')
      expect(result).toEqual({ enabled: ['app', 'api', 'server'], disabled: [] })
    })

    it('should filter empty patterns', () => {
      const result = parseNamespaces('app,,  ,server')
      expect(result).toEqual({ enabled: ['app', 'server'], disabled: [] })
    })

    it('should handle empty input', () => {
      const result = parseNamespaces('')
      expect(result).toEqual({ enabled: [], disabled: [] })
    })
  })

  describe('matchesPattern', () => {
    it('should match exact patterns', () => {
      expect(matchesPattern('app', 'app')).toBe(true)
      expect(matchesPattern('app:db', 'app:db')).toBe(true)
    })

    it('should not match different patterns', () => {
      expect(matchesPattern('app', 'api')).toBe(false)
      expect(matchesPattern('app:db', 'app:cache')).toBe(false)
    })

    it('should match wildcard at end', () => {
      expect(matchesPattern('app:db', 'app:*')).toBe(true)
      expect(matchesPattern('app:cache', 'app:*')).toBe(true)
      expect(matchesPattern('app:db:users', 'app:*')).toBe(true)
    })

    it('should not match unrelated wildcards', () => {
      expect(matchesPattern('api:db', 'app:*')).toBe(false)
      expect(matchesPattern('server', 'app:*')).toBe(false)
    })

    it('should match wildcard at start', () => {
      expect(matchesPattern('app:db', '*:db')).toBe(true)
      expect(matchesPattern('api:db', '*:db')).toBe(true)
    })

    it('should match wildcard in middle', () => {
      expect(matchesPattern('app:db:users', 'app:*:users')).toBe(true)
      expect(matchesPattern('app:cache:users', 'app:*:users')).toBe(true)
    })

    it('should match full wildcard', () => {
      expect(matchesPattern('app', '*')).toBe(true)
      expect(matchesPattern('app:db', '*')).toBe(true)
      expect(matchesPattern('anything', '*')).toBe(true)
    })

    it('should match multiple wildcards', () => {
      expect(matchesPattern('app:db:users:read', '*:*:*:read')).toBe(true)
    })
  })

  describe('isNamespaceEnabled', () => {
    it('should enable matching namespaces', () => {
      const pattern = parseNamespaces('app')
      expect(isNamespaceEnabled('app', pattern)).toBe(true)
    })

    it('should not enable non-matching namespaces', () => {
      const pattern = parseNamespaces('app')
      expect(isNamespaceEnabled('api', pattern)).toBe(false)
    })

    it('should enable wildcard matches', () => {
      const pattern = parseNamespaces('app:*')
      expect(isNamespaceEnabled('app:db', pattern)).toBe(true)
      expect(isNamespaceEnabled('app:cache', pattern)).toBe(true)
      expect(isNamespaceEnabled('api:db', pattern)).toBe(false)
    })

    it('should respect disabled patterns', () => {
      const pattern = parseNamespaces('app:*,-app:db')
      expect(isNamespaceEnabled('app:cache', pattern)).toBe(true)
      expect(isNamespaceEnabled('app:db', pattern)).toBe(false)
    })

    it('should prioritize disabled over enabled', () => {
      const pattern = parseNamespaces('*,-app:db')
      expect(isNamespaceEnabled('api:cache', pattern)).toBe(true)
      expect(isNamespaceEnabled('app:db', pattern)).toBe(false)
    })

    it('should handle multiple enabled patterns', () => {
      const pattern = parseNamespaces('app:*,api:*')
      expect(isNamespaceEnabled('app:db', pattern)).toBe(true)
      expect(isNamespaceEnabled('api:server', pattern)).toBe(true)
      expect(isNamespaceEnabled('server:db', pattern)).toBe(false)
    })

    it('should handle complex patterns', () => {
      const pattern = parseNamespaces('app:*,api:*,-app:db,-api:legacy')
      expect(isNamespaceEnabled('app:cache', pattern)).toBe(true)
      expect(isNamespaceEnabled('api:server', pattern)).toBe(true)
      expect(isNamespaceEnabled('app:db', pattern)).toBe(false)
      expect(isNamespaceEnabled('api:legacy', pattern)).toBe(false)
      expect(isNamespaceEnabled('server:db', pattern)).toBe(false)
    })

    it('should handle empty pattern', () => {
      const pattern = parseNamespaces('')
      expect(isNamespaceEnabled('app', pattern)).toBe(false)
    })

    it('should handle wildcard all', () => {
      const pattern = parseNamespaces('*')
      expect(isNamespaceEnabled('app', pattern)).toBe(true)
      expect(isNamespaceEnabled('app:db', pattern)).toBe(true)
      expect(isNamespaceEnabled('anything', pattern)).toBe(true)
    })
  })
})
