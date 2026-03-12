/**
 * Browser entry point for @lpm.dev/neo.debug
 */

import { createDebug, enable, disable } from './env/browser.js'
import { parseNamespaces, isNamespaceEnabled } from './core/namespace.js'
import type { DebugFactory } from './types.js'

/**
 * Debug factory function
 * Creates a new debugger instance for the given namespace
 */
const factory = createDebug as DebugFactory

/**
 * Enable debug output for the given namespaces
 */
factory.enable = enable

/**
 * Disable all debug output
 */
factory.disable = disable

/**
 * Check if a namespace is enabled
 */
factory.enabled = (namespace: string) => {
  try {
    const debug = localStorage.getItem('debug') || ''
    const pattern = parseNamespaces(debug)
    return isNamespaceEnabled(namespace, pattern)
  } catch {
    return false
  }
}

export default factory
export { createDebug as debug, enable, disable }
export type { Debugger, DebugFactory } from './types.js'
