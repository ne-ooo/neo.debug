/**
 * Inline implementation of ms package for zero dependencies
 * Converts milliseconds to human-readable format and vice versa
 */

/**
 * Convert milliseconds to human-readable format
 * @param ms - Milliseconds to format
 * @returns Formatted string (e.g., '1s', '5m', '2h')
 */
export function formatMs(ms: number): string {
  const absMs = Math.abs(ms)

  if (absMs >= 86400000) {
    return `${Math.round(ms / 86400000)}d`
  }
  if (absMs >= 3600000) {
    return `${Math.round(ms / 3600000)}h`
  }
  if (absMs >= 60000) {
    return `${Math.round(ms / 60000)}m`
  }
  if (absMs >= 1000) {
    return `${Math.round(ms / 1000)}s`
  }
  return `${ms}ms`
}

/**
 * Parse a time string to milliseconds
 * @param str - Time string to parse (e.g., '1s', '5m', '2h')
 * @returns Milliseconds, or NaN if invalid
 */
export function parseMs(str: string): number {
  const match = /^(-?\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/i.exec(str)

  if (!match) {
    return NaN
  }

  const n = parseFloat(match[1])
  const unit = (match[2] || 'ms').toLowerCase()

  const units: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  }

  return n * (units[unit] || 1)
}
