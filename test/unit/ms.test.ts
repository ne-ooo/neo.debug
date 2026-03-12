import { describe, it, expect } from 'vitest'
import { formatMs, parseMs } from '../../src/utils/ms.js'

describe('ms utility', () => {
  describe('formatMs', () => {
    it('should format milliseconds', () => {
      expect(formatMs(100)).toBe('100ms')
      expect(formatMs(500)).toBe('500ms')
      expect(formatMs(999)).toBe('999ms')
    })

    it('should format seconds', () => {
      expect(formatMs(1000)).toBe('1s')
      expect(formatMs(5000)).toBe('5s')
      expect(formatMs(30000)).toBe('30s')
      expect(formatMs(59999)).toBe('60s')
    })

    it('should format minutes', () => {
      expect(formatMs(60000)).toBe('1m')
      expect(formatMs(300000)).toBe('5m')
      expect(formatMs(1800000)).toBe('30m')
    })

    it('should format hours', () => {
      expect(formatMs(3600000)).toBe('1h')
      expect(formatMs(7200000)).toBe('2h')
      expect(formatMs(18000000)).toBe('5h')
    })

    it('should format days', () => {
      expect(formatMs(86400000)).toBe('1d')
      expect(formatMs(172800000)).toBe('2d')
      expect(formatMs(604800000)).toBe('7d')
    })

    it('should handle negative values', () => {
      expect(formatMs(-1000)).toBe('-1s')
      expect(formatMs(-60000)).toBe('-1m')
    })
  })

  describe('parseMs', () => {
    it('should parse milliseconds', () => {
      expect(parseMs('100ms')).toBe(100)
      expect(parseMs('500ms')).toBe(500)
      expect(parseMs('1000ms')).toBe(1000)
    })

    it('should parse seconds', () => {
      expect(parseMs('1s')).toBe(1000)
      expect(parseMs('5s')).toBe(5000)
      expect(parseMs('30s')).toBe(30000)
    })

    it('should parse minutes', () => {
      expect(parseMs('1m')).toBe(60000)
      expect(parseMs('5m')).toBe(300000)
      expect(parseMs('30m')).toBe(1800000)
    })

    it('should parse hours', () => {
      expect(parseMs('1h')).toBe(3600000)
      expect(parseMs('2h')).toBe(7200000)
      expect(parseMs('5h')).toBe(18000000)
    })

    it('should parse days', () => {
      expect(parseMs('1d')).toBe(86400000)
      expect(parseMs('2d')).toBe(172800000)
      expect(parseMs('7d')).toBe(604800000)
    })

    it('should handle decimals', () => {
      expect(parseMs('1.5s')).toBe(1500)
      expect(parseMs('0.5m')).toBe(30000)
      expect(parseMs('2.5h')).toBe(9000000)
    })

    it('should handle negative values', () => {
      expect(parseMs('-1s')).toBe(-1000)
      expect(parseMs('-5m')).toBe(-300000)
    })

    it('should default to milliseconds when no unit', () => {
      expect(parseMs('100')).toBe(100)
      expect(parseMs('1000')).toBe(1000)
    })

    it('should return NaN for invalid input', () => {
      expect(parseMs('invalid')).toBeNaN()
      expect(parseMs('abc123')).toBeNaN()
      expect(parseMs('')).toBeNaN()
    })

    it('should handle spaces', () => {
      expect(parseMs('1 s')).toBe(1000)
      expect(parseMs('5 m')).toBe(300000)
    })
  })
})
