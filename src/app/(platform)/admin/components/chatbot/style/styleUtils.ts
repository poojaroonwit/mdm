// Utility functions for style configuration

/**
 * Extract hex color from value (for color input which only accepts hex)
 */
export function extractHexColor(value: string | undefined): string {
  if (!value) return '#000000'
  // If it's already a hex color, return it
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
    return value
  }
  // If it's a gradient or other format, try to extract first hex color
  const hexMatch = value.match(/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/i)
  return hexMatch ? hexMatch[0] : '#000000'
}

/**
 * Extract numeric value from string (removes px, %, etc.)
 */
export function extractNumericValue(value: string | undefined): string {
  if (!value) return ''
  const v = String(value).trim()
  if (v === '') return ''
  // Extract number part
  const match = v.match(/^-?\d+(\.\d+)?/)
  return match ? match[0] : ''
}

/**
 * Ensure value has a unit (px, %, rem, em, vh, vw) or add px
 */
export function ensurePx(value: string): string {
  if (value == null) return ''
  const v = String(value).trim()
  if (v === '') return ''
  if (/px|%|rem|em|vh|vw$/i.test(v)) return v
  if (/^-?\d+(\.\d+)?$/.test(v)) return `${v}px`
  return v
}

