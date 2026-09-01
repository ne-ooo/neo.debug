import { describe, it, expect } from 'vitest'
import { formatArgs } from '../../src/core/format.js'

describe('format', () => {
  describe('formatArgs', () => {
    it('should return empty string for empty args', () => {
      expect(formatArgs([])).toBe('')
    })

    it('should convert non-string first arg to string', () => {
      expect(formatArgs([123])).toBe('123')
      expect(formatArgs([true])).toBe('true')
      expect(formatArgs([null])).toBe('null')
    })

    it('should join multiple non-string args', () => {
      expect(formatArgs([123, 456])).toBe('123 456')
      expect(formatArgs([true, false, null])).toBe('true false null')
    })

    it('should format %s (string)', () => {
      expect(formatArgs(['user %s', 'john'])).toBe('user john')
      expect(formatArgs(['%s %s', 'hello', 'world'])).toBe('hello world')
    })

    it('should format %d (number)', () => {
      expect(formatArgs(['count %d', 42])).toBe('count 42')
      expect(formatArgs(['%d + %d', 1, 2])).toBe('1 + 2')
    })

    it('should format %i (integer)', () => {
      expect(formatArgs(['int %i', '42'])).toBe('int 42')
      expect(formatArgs(['%i', '3.14'])).toBe('3')
    })

    it('should format %f (float)', () => {
      expect(formatArgs(['pi %f', '3.14'])).toBe('pi 3.14')
      expect(formatArgs(['%f', 2.5])).toBe('2.5')
    })

    it('should format %j (JSON)', () => {
      expect(formatArgs(['data %j', { foo: 'bar' }])).toBe('data {"foo":"bar"}')
      expect(formatArgs(['%j', [1, 2, 3]])).toBe('[1,2,3]')
    })

    it('should format %o (object pretty)', () => {
      const result = formatArgs(['obj %o', { foo: 'bar' }])
      expect(result).toContain('foo')
      expect(result).toContain('bar')
      // Pretty printed JSON should have newlines
      expect(result).toMatch(/{\s+"foo":\s+"bar"\s+}/)
    })

    it('should format %O (object toString)', () => {
      expect(formatArgs(['obj %O', { foo: 'bar' }])).toBe('obj [object Object]')
      expect(formatArgs(['%O', 'test'])).toBe('test')
    })

    it('should handle multiple formatters', () => {
      expect(formatArgs(['user %s has %d points', 'john', 42])).toBe('user john has 42 points')
      expect(formatArgs(['%s: %j', 'data', { x: 1 }])).toBe('data: {"x":1}')
    })

    it('should append remaining args', () => {
      expect(formatArgs(['user %s', 'john', 'extra', 'args'])).toBe('user john extra args')
      expect(formatArgs(['%d', 42, 'more', 'stuff'])).toBe('42 more stuff')
    })

    it('should preserve unmatched format specifiers', () => {
      expect(formatArgs(['user %s has %d', 'john'])).toBe('user john has %d')
      expect(formatArgs(['%s %s %s', 'a', 'b'])).toBe('a b %s')
    })

    it('should handle strings without formatters', () => {
      expect(formatArgs(['plain string'])).toBe('plain string')
      expect(formatArgs(['plain string', 'extra'])).toBe('plain string extra')
    })

    it('should handle edge cases', () => {
      expect(formatArgs(['%s', undefined])).toBe('undefined')
      expect(formatArgs(['%s', null])).toBe('null')
      expect(formatArgs(['%d', NaN])).toBe('NaN')
      expect(formatArgs(['%d', Infinity])).toBe('Infinity')
    })

    it('should handle circular references in %j', () => {
      const obj: any = { foo: 'bar' }
      obj.self = obj
      const result = formatArgs(['%j', obj])
      expect(result).toBe('[Circular]')
    })

    it('should not mislabel non-circular JSON failures', () => {
      expect(formatArgs(['%j', 1n])).toBe('1')
      expect(formatArgs(['%j', { value: 1n }])).toBe('[object Object]')
    })

    it('should never throw for values without primitive conversion', () => {
      const value = Object.create(null)

      expect(formatArgs([value])).toBe('[Unformattable]')
      expect(formatArgs(['value', value])).toBe('value [Unformattable]')
      expect(formatArgs(['%O', value])).toBe('[Unformattable]')
    })

    it('should never throw when a formatter conversion fails', () => {
      const value = {
        [Symbol.toPrimitive]() {
          throw new Error('conversion failed')
        },
      }

      expect(formatArgs(['%s', value])).toBe('[Unformattable]')
      expect(formatArgs(['%d', Symbol('value')])).toBe('[Unformattable]')
    })

    it('should collapse escaped percent signs without consuming values', () => {
      expect(formatArgs(['100%% %s', 'complete'])).toBe('100% complete')
      expect(formatArgs(['%%%s', 'value'])).toBe('%value')
    })

    it('should preserve unknown formatters', () => {
      expect(formatArgs(['100% complete'])).toBe('100% complete')
      expect(formatArgs(['%x is unknown', 'value'])).toBe('%x is unknown value')
    })
  })
})
