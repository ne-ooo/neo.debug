/**
 * Deterministic color selection for namespaces
 * Each namespace always gets the same color
 */

/**
 * Simple hash function for consistent color selection
 * @param str - String to hash
 * @returns Hash value as a positive integer
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Select a color index from a namespace
 * Same namespace always returns the same index
 * @param namespace - The namespace to hash
 * @param colorCount - Number of colors in the palette
 * @returns Index in the color palette (0 to colorCount-1)
 */
export function selectColorIndex(namespace: string, colorCount: number): number {
  return hashCode(namespace) % colorCount
}
