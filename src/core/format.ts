/**
 * Printf-style string formatting
 * Supports %s, %d, %i, %f, %j, %o, %O formatters
 */

/**
 * Type for formatter functions
 */
type FormatterFn = (val: any) => string

const UNFORMATTABLE = '[Unformattable]'

function safeString(val: any): string {
  try {
    return String(val)
  } catch {
    return UNFORMATTABLE
  }
}

function isCircularJsonError(error: unknown): boolean {
  return error instanceof Error && /circular|cyclic/i.test(error.message)
}

function safeJsonStringify(val: any, space?: number): string {
  try {
    return JSON.stringify(val, null, space) ?? 'undefined'
  } catch (error) {
    return isCircularJsonError(error) ? '[Circular]' : safeString(val)
  }
}

function applyFormatter(formatter: FormatterFn, val: any): string {
  try {
    return formatter(val)
  } catch {
    return UNFORMATTABLE
  }
}

/**
 * Printf-style formatters
 */
const formatters: Record<string, FormatterFn> = {
  s: safeString, // String
  d: (val) => String(Number(val)), // Number
  i: (val) => String(parseInt(String(val), 10)), // Integer
  f: (val) => String(parseFloat(String(val))), // Float
  j: (val) => safeJsonStringify(val), // JSON
  o: (val) => safeJsonStringify(val, 2), // Object inspection (pretty JSON)
  O: safeString, // Object toString
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
    return args.map(safeString).join(' ')
  }

  // Replace format specifiers
  let index = 0
  const formatted = format.replace(/%([sdifjOo])/g, (match, type) => {
    if (index >= values.length) {
      return match
    }
    const formatter = formatters[type]
    return applyFormatter(formatter!, values[index++])
  })

  // Append remaining args
  const remaining = values.slice(index)
  if (remaining.length > 0) {
    return `${formatted} ${remaining.map(safeString).join(' ')}`
  }

  return formatted
}
