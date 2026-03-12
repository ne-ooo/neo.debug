/**
 * Node.js entry point for @lpm.dev/neo.debug
 */

import { createDebug, enable, disable } from './env/node.js'
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
  const pattern = parseNamespaces(process.env['DEBUG'] || '')
  return isNamespaceEnabled(namespace, pattern)
}

export default factory
export { createDebug as debug, enable, disable }
export type { Debugger, DebugFactory } from './types.js'
