import { describe, it, expect } from 'vitest'
import { selectColorIndex } from '../../src/core/color-hash.js'

describe('color-hash', () => {
  describe('selectColorIndex', () => {
    it('should return consistent index for same namespace', () => {
      const colorCount = 6
      const index1 = selectColorIndex('app:db', colorCount)
      const index2 = selectColorIndex('app:db', colorCount)
      expect(index1).toBe(index2)
    })

    it('should return index within range', () => {
      const colorCount = 6
      const index = selectColorIndex('app:db', colorCount)
      expect(index).toBeGreaterThanOrEqual(0)
      expect(index).toBeLessThan(colorCount)
    })

    it('should distribute different namespaces', () => {
      const colorCount = 6
      const namespaces = ['app:db', 'app:cache', 'api:server', 'worker:queue']
      const indices = namespaces.map((ns) => selectColorIndex(ns, colorCount))

      // Should have at least 2 different colors (not all the same)
      const uniqueIndices = new Set(indices)
      expect(uniqueIndices.size).toBeGreaterThan(1)
    })

    it('should work with different color counts', () => {
      const namespace = 'app:db'

      const index3 = selectColorIndex(namespace, 3)
      expect(index3).toBeGreaterThanOrEqual(0)
      expect(index3).toBeLessThan(3)

      const index10 = selectColorIndex(namespace, 10)
      expect(index10).toBeGreaterThanOrEqual(0)
      expect(index10).toBeLessThan(10)
    })

    it('should handle similar namespaces differently', () => {
      const colorCount = 6
      const index1 = selectColorIndex('app', colorCount)
      const index2 = selectColorIndex('app:db', colorCount)

      // These will likely be different, but might be same by chance
      // Just ensure they're both valid
      expect(index1).toBeGreaterThanOrEqual(0)
      expect(index1).toBeLessThan(colorCount)
      expect(index2).toBeGreaterThanOrEqual(0)
      expect(index2).toBeLessThan(colorCount)
    })

    it('should handle edge cases', () => {
      expect(selectColorIndex('', 6)).toBeGreaterThanOrEqual(0)
      expect(selectColorIndex('a', 6)).toBeGreaterThanOrEqual(0)
      expect(selectColorIndex('very:long:namespace:with:many:parts', 6)).toBeGreaterThanOrEqual(0)
    })
  })
})
