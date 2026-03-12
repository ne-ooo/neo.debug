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
  // Exact match
  if (namespace === pattern) {
    return true
  }

  // Wildcard match - convert pattern to regex
  // Escape special regex chars except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
  const regexPattern = '^' + escaped.replace(/\*/g, '.*?') + '$'
  const regex = new RegExp(regexPattern)

  return regex.test(namespace)
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
  // Check disabled patterns first (higher priority)
  for (const p of pattern.disabled) {
    if (matchesPattern(namespace, p)) {
      return false
    }
  }

  // Check enabled patterns
  for (const p of pattern.enabled) {
    if (matchesPattern(namespace, p)) {
      return true
    }
  }

  // Not explicitly enabled
  return false
}
