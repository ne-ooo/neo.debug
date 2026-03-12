/**
 * Printf-style string formatting
 * Supports %s, %d, %i, %f, %j, %o, %O formatters
 */

/**
 * Type for formatter functions
 */
type FormatterFn = (val: any) => string

/**
 * Printf-style formatters
 */
const formatters: Record<string, FormatterFn> = {
  s: String, // String
  d: (val) => String(Number(val)), // Number
  i: (val) => String(parseInt(String(val), 10)), // Integer
  f: (val) => String(parseFloat(String(val))), // Float
  j: (val) => {
    // JSON
    try {
      return JSON.stringify(val)
    } catch {
      return '[Circular]'
    }
  },
  o: (val) => {
    // Object inspection (pretty JSON)
    try {
      return JSON.stringify(val, null, 2)
    } catch {
      return String(val)
    }
  },
  O: (val) => String(val), // Object toString
}

/**
 * Format arguments using printf-style formatting
 * @param args - Arguments to format
 * @returns Formatted string
 *
 * @example
 * formatArgs(['user %s has %d points', 'john', 42])
 * // => 'user john has 42 points'
 */
export function formatArgs(args: any[]): string {
  if (args.length === 0) {
    return ''
  }

  const [format, ...values] = args

  // If first arg is not a string, just join all args
  if (typeof format !== 'string') {
    return args.map(String).join(' ')
  }

  // Replace format specifiers
  let index = 0
  const formatted = format.replace(/%([sdifjOo])/g, (match, type) => {
    if (index >= values.length) {
      return match
    }
    const formatter = formatters[type]
    if (!formatter) {
      return match
    }
    return formatter(values[index++])
  })

  // Append remaining args
  const remaining = values.slice(index)
  if (remaining.length > 0) {
    return `${formatted} ${remaining.map(String).join(' ')}`
  }

  return formatted
}
