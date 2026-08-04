/**
 * Node.js environment implementation
 * Uses process.env for DEBUG and neo.colors for terminal colors
 */

import { createRequire } from 'node:module'

import { formatMs } from '../utils/ms.js'
import { parseNamespaces, isNamespaceEnabled, type NamespacePattern } from '../core/namespace.js'
import { selectColorIndex } from '../core/color-hash.js'
import { formatArgs } from '../core/format.js'
import type { Debugger } from '../types.js'

const loadOptionalModule = createRequire(import.meta.url)

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
      // createRequire works from both the ESM and CJS Node builds.
      const colorsModule = loadOptionalModule('@lpm.dev/neo.colors')
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
let namespaceVersion = 0

/**
 * Create a debugger instance for a namespace
 * @param namespace - The namespace for this debugger
 * @returns A debugger function
 */
export function createDebug(namespace: string): Debugger {
  const palette = getColorPalette()
  const colorIndex = selectColorIndex(namespace, palette.length)
  const colorFn = palette[colorIndex]
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

    // Output with color
    const prefix = colorFn ? colorFn(namespace) : namespace
    const diffStr = diff
      ? colors && colors.gray
        ? ` ${colors.gray(`+${diff}`)}`
        : ` +${diff}`
      : ''

    // Write to stderr (debug convention)
    process.stderr.write(`${prefix} ${message}${diffStr}\n`)
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
  namespacePattern = parseNamespaces(namespaces)
  namespaceVersion += 1
}

/**
 * Disable all debug output
 */
export function disable(): void {
  namespacePattern = { enabled: [], disabled: [] }
  namespaceVersion += 1
}

/**
 * Check if a namespace is enabled using the same state as debugger instances.
 */
export function enabled(namespace: string): boolean {
  return isNamespaceEnabled(namespace, namespacePattern)
}
