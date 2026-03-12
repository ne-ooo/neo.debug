/**
 * A debugger instance for a specific namespace
 */
export interface Debugger {
  /**
   * Log a message to the debug output
   */
  (...args: any[]): void

  /**
   * The namespace this debugger instance is for
   */
  namespace: string

  /**
   * Whether this debugger is currently enabled
   */
  enabled: boolean

  /**
   * Destroy this debugger instance
   */
  destroy: () => void
}

/**
 * The debug factory function that creates debugger instances
 */
export interface DebugFactory {
  /**
   * Create a new debugger for the given namespace
   */
  (namespace: string): Debugger

  /**
   * Enable debug output for the given namespaces
   */
  enable(namespaces: string): void

  /**
   * Disable all debug output
   */
  disable(): void

  /**
   * Check if a namespace is enabled
   */
  enabled(namespace: string): boolean
}
