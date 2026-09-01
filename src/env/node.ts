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

interface NodeDebugState {
  namespacePattern: NamespacePattern
  namespaceVersion: number
  stderrBlocked: boolean
  droppedMessages: number
}

const stateKey = Symbol.for('@lpm.dev/neo.debug/node-state@1')
const stateRegistry = globalThis as unknown as Record<symbol, NodeDebugState | undefined>
const nodeState =
  stateRegistry[stateKey] ??
  (stateRegistry[stateKey] = {
    namespacePattern: parseNamespaces(process.env['DEBUG'] || ''),
    namespaceVersion: 0,
    stderrBlocked: false,
    droppedMessages: 0,
  })

const TERMINAL_CONTROL_CHARACTERS =
  /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028-\u202e\u2066-\u2069]/g

function escapeControlCharacter(character: string): string {
  switch (character) {
    case '\b':
      return '\\b'
    case '\t':
      return '\\t'
    case '\n':
      return '\\n'
    case '\v':
      return '\\v'
    case '\f':
      return '\\f'
    case '\r':
      return '\\r'
    default: {
      const code = character.charCodeAt(0)
      const width = code <= 0xff ? 2 : 4
      const prefix = code <= 0xff ? '\\x' : '\\u'
      return `${prefix}${code.toString(16).padStart(width, '0')}`
    }
  }
}

function escapeTerminalControls(value: string): string {
  return value.replace(TERMINAL_CONTROL_CHARACTERS, escapeControlCharacter)
}

function incrementDroppedMessages(): void {
  if (nodeState.droppedMessages < Number.MAX_SAFE_INTEGER) {
    nodeState.droppedMessages += 1
  }
}

function writeDebugOutput(output: string): void {
  if (nodeState.stderrBlocked) {
    incrementDroppedMessages()
    return
  }

  if (process.stderr.write(output)) {
    return
  }

  nodeState.stderrBlocked = true
  process.stderr.once('drain', () => {
    nodeState.stderrBlocked = false
    const droppedMessages = nodeState.droppedMessages
    nodeState.droppedMessages = 0

    if (droppedMessages > 0) {
      const noun = droppedMessages === 1 ? 'message' : 'messages'
      writeDebugOutput(
        `[neo.debug] dropped ${droppedMessages} ${noun} while stderr was backpressured\n`
      )
    }
  })
}

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
 * Create a debugger instance for a namespace
 * @param namespace - The namespace for this debugger
 * @returns A debugger function
 */
export function createDebug(namespace: string): Debugger {
  const palette = getColorPalette()
  const colorIndex = selectColorIndex(namespace, palette.length)
  const colorFn = palette[colorIndex]
  const safeNamespace = escapeTerminalControls(namespace)
  const prefix = colorFn ? colorFn(safeNamespace) : safeNamespace
  let prevTimestamp: number | undefined
  let enabledVersion = -1
  let enabledForNamespace = false
  let enabledOverride: boolean | undefined

  const isEnabled = (): boolean => {
    if (enabledOverride !== undefined) {
      return enabledOverride
    }
    if (enabledVersion !== nodeState.namespaceVersion) {
      enabledForNamespace = isNamespaceEnabled(namespace, nodeState.namespacePattern)
      enabledVersion = nodeState.namespaceVersion
    }
    return enabledForNamespace
  }

  const debug = ((...args: any[]): void => {
    // Check if enabled
    if (!isEnabled()) {
      return
    }

    if (nodeState.stderrBlocked) {
      incrementDroppedMessages()
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
    const safeMessage = escapeTerminalControls(message)
    const diffStr = diff
      ? colors && colors.gray
        ? ` ${colors.gray(`+${diff}`)}`
        : ` +${diff}`
      : ''

    // Write to stderr (debug convention)
    writeDebugOutput(`${prefix} ${safeMessage}${diffStr}\n`)
  }) as Debugger

  debug.namespace = namespace
  // Keep enabled reactive to subsequent enable() and disable() calls.
  Object.defineProperty(debug, 'enabled', {
    get: isEnabled,
    set: (value: boolean) => {
      enabledOverride = value
    },
    enumerable: true,
    configurable: false,
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
  if (namespaces) {
    process.env['DEBUG'] = namespaces
  } else {
    delete process.env['DEBUG']
  }
  nodeState.namespacePattern = parseNamespaces(namespaces)
  nodeState.namespaceVersion += 1
}

/**
 * Disable all debug output
 */
export function disable(): string {
  const previousNamespaces = [
    ...nodeState.namespacePattern.enabled,
    ...nodeState.namespacePattern.disabled.map((namespace) => `-${namespace}`),
  ].join(',')
  enable('')
  return previousNamespaces
}

/**
 * Check if a namespace is enabled using the same state as debugger instances.
 */
export function enabled(namespace: string): boolean {
  return isNamespaceEnabled(namespace, nodeState.namespacePattern)
}
