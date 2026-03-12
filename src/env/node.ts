/**
 * Node.js environment implementation
 * Uses process.env for DEBUG and neo.colors for terminal colors
 */

import { formatMs } from '../utils/ms.js'
import { parseNamespaces, isNamespaceEnabled, type NamespacePattern } from '../core/namespace.js'
import { selectColorIndex } from '../core/color-hash.js'
import { formatArgs } from '../core/format.js'
import type { Debugger } from '../types.js'

// Conditional import of neo.colors (peer dependency)
let colors: any = null
let colorPalette: Array<(text: string) => string> | null = null
let isLoadingColors = false

// Lazy load neo.colors
function getColorPalette(): Array<(text: string) => string> {
  if (colorPalette) {
    return colorPalette
  }

  if (!isLoadingColors) {
    isLoadingColors = true
    try {
      // Try to load neo.colors if available (synchronous require for CJS compatibility)
      const colorsModule = require('@lpm.dev/neo.colors')
      colors = colorsModule.default || colorsModule

      // Color palette using neo.colors
      colorPalette = [
        colors.cyan,
        colors.magenta,
        colors.blue,
        colors.yellow,
        colors.green,
        colors.red,
      ]
    } catch {
      // neo.colors not available, use plain text
      const identity = (text: string) => text
      colorPalette = [identity, identity, identity, identity, identity, identity]
    }
  }

  // Return current palette or temporary fallback
  return colorPalette || [
    (text: string) => text,
    (text: string) => text,
    (text: string) => text,
    (text: string) => text,
    (text: string) => text,
    (text: string) => text,
  ]
}

/**
 * Global namespace pattern from DEBUG env var
 */
let namespacePattern: NamespacePattern = parseNamespaces(process.env['DEBUG'] || '')

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
  const palette = getColorPalette()
  const colorIndex = selectColorIndex(namespace, palette.length)
  const colorFn = palette[colorIndex]

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

    // Output with color
    const prefix = colorFn ? colorFn(namespace) : namespace
    const diffStr = diff
      ? colors && colors.gray
        ? ` ${colors.gray(`+${diff}`)}`
        : ` +${diff}`
      : ''

    // Write to stderr (debug convention)
    process.stderr.write(`${prefix} ${message}${diffStr}\n`)
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
  namespacePattern = parseNamespaces(namespaces)
}

/**
 * Disable all debug output
 */
export function disable(): void {
  namespacePattern = { enabled: [], disabled: [] }
}
