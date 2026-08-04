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
let namespaceVersion = 0

/**
 * Create a debugger instance for a namespace
 * @param namespace - The namespace for this debugger
 * @returns A debugger function
 */
export function createDebug(namespace: string): Debugger {
  const colorIndex = selectColorIndex(namespace, browserColors.length)
  const color = browserColors[colorIndex]
  let prevTimestamp: number | undefined
  let enabledVersion = -1
  let enabledForNamespace = false

  const isEnabled = (): boolean => {
    if (enabledVersion !== namespaceVersion) {
      enabledForNamespace = isNamespaceEnabled(namespace, namespacePattern)
      enabledVersion = namespaceVersion
    }
    return enabledForNamespace
  }

  const debug = ((...args: any[]): void => {
    // Check if enabled
    if (!isEnabled()) {
      return
    }

    // Format message
    const message = formatArgs(args)

    // Calculate time diff
    const now = Date.now()
    const prev = prevTimestamp
    prevTimestamp = now

    const diff = prev === undefined ? '' : formatMs(now - prev)

    // Use %c for colored console output
    if (diff) {
      console.log(
        '%c%s%c %s %c%s',
        `color: ${color}; font-weight: bold`,
        namespace,
        'color: inherit',
        message,
        'color: gray; font-weight: normal',
        `+${diff}`
      )
    } else {
      console.log(
        '%c%s%c %s',
        `color: ${color}; font-weight: bold`,
        namespace,
        'color: inherit',
        message
      )
    }
  }) as Debugger

  debug.namespace = namespace
  // Keep enabled reactive to subsequent enable() and disable() calls.
  Object.defineProperty(debug, 'enabled', {
    get: isEnabled,
    configurable: true,
  })
  debug.destroy = () => {
    prevTimestamp = undefined
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
  namespaceVersion += 1
}

/**
 * Disable all debug output
 */
export function disable(): void {
  saveNamespaces('')
  namespacePattern = { enabled: [], disabled: [] }
  namespaceVersion += 1
}

/**
 * Check if a namespace is enabled using the same state as debugger instances.
 */
export function enabled(namespace: string): boolean {
  return isNamespaceEnabled(namespace, namespacePattern)
}
