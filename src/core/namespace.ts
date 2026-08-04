/**
 * Namespace filtering with wildcard support
 * Handles patterns like DEBUG=app:*,-app:db
 */

/**
 * Parsed namespace pattern with enabled and disabled lists
 */
export interface NamespacePattern {
  /** Patterns to enable (e.g., 'app:*') */
  enabled: string[]
  /** Patterns to disable (e.g., 'app:db' from '-app:db') */
  disabled: string[]
}

interface CompiledPattern {
  leadingWildcard: boolean
  trailingWildcard: boolean
  segments: string[]
}

interface CompiledNamespacePattern {
  enabled: CompiledPattern[]
  disabled: CompiledPattern[]
}

/**
 * Compiled matchers are associated with parsed pattern objects without
 * changing their public shape. Weak keys prevent obsolete enable() states
 * from being retained.
 */
const compiledPatterns = new WeakMap<NamespacePattern, CompiledNamespacePattern>()

function compilePattern(pattern: string): CompiledPattern {
  return {
    leadingWildcard: pattern.startsWith('*'),
    trailingWildcard: pattern.endsWith('*'),
    segments: pattern.split('*'),
  }
}

function getCompiledPatterns(pattern: NamespacePattern): CompiledNamespacePattern {
  const cached = compiledPatterns.get(pattern)
  if (cached) {
    return cached
  }

  const compiled = {
    enabled: pattern.enabled.map(compilePattern),
    disabled: pattern.disabled.map(compilePattern),
  }
  compiledPatterns.set(pattern, compiled)
  return compiled
}

/**
 * Match a namespace against a compiled glob containing only `*` wildcards.
 * Literal segments are searched from left to right, avoiding regex
 * backtracking and keeping work bounded by the input strings.
 */
function matchesCompiledPattern(namespace: string, pattern: CompiledPattern): boolean {
  const { leadingWildcard, trailingWildcard, segments } = pattern

  if (segments.length === 1) {
    return namespace === segments[0]
  }

  let namespaceStart = 0
  let namespaceEnd = namespace.length
  let firstMiddleSegment = 0
  let lastMiddleSegment = segments.length

  if (!leadingWildcard) {
    const first = segments[0]
    if (first === undefined || !namespace.startsWith(first)) {
      return false
    }
    namespaceStart = first.length
    firstMiddleSegment = 1
  }

  if (!trailingWildcard) {
    const last = segments.at(-1)
    if (last === undefined || !namespace.endsWith(last)) {
      return false
    }
    namespaceEnd -= last.length
    lastMiddleSegment -= 1
  }

  if (namespaceStart > namespaceEnd) {
    return false
  }

  for (let i = firstMiddleSegment; i < lastMiddleSegment; i++) {
    const segment = segments[i]
    if (!segment) {
      continue
    }

    const matchIndex = namespace.indexOf(segment, namespaceStart)
    if (matchIndex === -1 || matchIndex + segment.length > namespaceEnd) {
      return false
    }
    namespaceStart = matchIndex + segment.length
  }

  return true
}

/**
 * Parse DEBUG environment string into enabled/disabled patterns
 * @param input - Comma or space-separated list of patterns (e.g., 'app:*,-app:db')
 * @returns Parsed patterns with enabled and disabled lists
 */
export function parseNamespaces(input: string): NamespacePattern {
  const patterns = input.split(/[\s,]+/).filter(Boolean)
  const enabled: string[] = []
  const disabled: string[] = []

  for (const pattern of patterns) {
    if (pattern.startsWith('-')) {
      disabled.push(pattern.slice(1))
    } else {
      enabled.push(pattern)
    }
  }

  return { enabled, disabled }
}

/**
 * Check if a namespace matches a pattern (with wildcard support)
 * @param namespace - The namespace to check (e.g., 'app:db')
 * @param pattern - The pattern to match against (e.g., 'app:*')
 * @returns True if the namespace matches the pattern
 */
export function matchesPattern(namespace: string, pattern: string): boolean {
  return matchesCompiledPattern(namespace, compilePattern(pattern))
}

/**
 * Check if a namespace is enabled based on the pattern
 * Disabled patterns take precedence over enabled patterns
 * @param namespace - The namespace to check
 * @param pattern - The parsed namespace pattern
 * @returns True if the namespace is enabled
 */
export function isNamespaceEnabled(
  namespace: string,
  pattern: NamespacePattern
): boolean {
  const compiled = getCompiledPatterns(pattern)

  // Check disabled patterns first (higher priority)
  for (const matcher of compiled.disabled) {
    if (matchesCompiledPattern(namespace, matcher)) {
      return false
    }
  }

  // Check enabled patterns
  for (const matcher of compiled.enabled) {
    if (matchesCompiledPattern(namespace, matcher)) {
      return true
    }
  }

  // Not explicitly enabled
  return false
}
