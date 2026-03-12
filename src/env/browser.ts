/**
 * Browser environment implementation
 * Uses localStorage for DEBUG and %c for console colors
 */

import { formatMs } from '../utils/ms.js'
import { parseNamespaces, isNamespaceEnabled, type NamespacePattern } from '../core/namespace.js'
import { selectColorIndex } from '../core/color-hash.js'
import { formatArgs } from '../core/format.js'
import type { Debugger } from '../types.js'

/**
 * Browser color palette (CSS colors for %c)
 */
const browserColors = [
  '#0088cc', // cyan
  '#cc00cc', // magenta
  '#0000cc', // blue
  '#cccc00', // yellow
  '#00cc00', // green
  '#cc0000', // red
]

/**
 * Load namespaces from localStorage
 */
function loadNamespaces(): string {
  try {
    return localStorage.getItem('debug') || ''
  } catch {
    // localStorage not available (e.g., in Node.js)
    return ''
  }
}

/**
 * Save namespaces to localStorage
 */
function saveNamespaces(value: string): void {
  try {
    if (value) {
      localStorage.setItem('debug', value)
    } else {
      localStorage.removeItem('debug')
    }
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Global namespace pattern from localStorage
 */
let namespacePattern: NamespacePattern = parseNamespaces(loadNamespaces())

/**
 * Previous timestamps for calculating time diff
 */
const prevTimestamps = new Map<string, number>()

/**
 * Create a debugger instance for a namespace
 * @param namespace - The namespace for this debugger
 * @returns A debugger function
 */
export function createDebug(namespace: string): Debugger {
  const colorIndex = selectColorIndex(namespace, browserColors.length)
  const color = browserColors[colorIndex]

  function debug(...args: any[]): void {
    // Check if enabled
    if (!isNamespaceEnabled(namespace, namespacePattern)) {
      return
    }

    // Format message
    const message = formatArgs(args)

    // Calculate time diff
    const now = Date.now()
    const prev = prevTimestamps.get(namespace)
    prevTimestamps.set(namespace, now)

    const diff = prev ? formatMs(now - prev) : ''

    // Use %c for colored console output
    if (diff) {
      console.log(
        `%c${namespace}%c ${message} %c+${diff}`,
        `color: ${color}; font-weight: bold`,
        'color: inherit',
        'color: gray; font-weight: normal'
      )
    } else {
      console.log(
        `%c${namespace}%c ${message}`,
        `color: ${color}; font-weight: bold`,
        'color: inherit'
      )
    }
  }

  debug.namespace = namespace
  // BUG-6 fix: use a getter so debug.enabled reflects the current namespacePattern,
  // not a stale snapshot captured at creation time
  Object.defineProperty(debug, 'enabled', {
    get: () => isNamespaceEnabled(namespace, namespacePattern),
    configurable: true,
  })
  debug.destroy = () => {
    // Cleanup if needed
    prevTimestamps.delete(namespace)
  }

  return debug
}

/**
 * Enable debug output for the given namespaces
 * @param namespaces - Namespace patterns to enable
 */
export function enable(namespaces: string): void {
  saveNamespaces(namespaces)
  namespacePattern = parseNamespaces(namespaces)
}

/**
 * Disable all debug output
 */
export function disable(): void {
  saveNamespaces('')
  namespacePattern = { enabled: [], disabled: [] }
}
