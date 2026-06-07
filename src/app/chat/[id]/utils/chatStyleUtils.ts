export const SHADOW_BUFFER = 40
export const BUTTON_SHADOW_BUFFER = 12

export function hexToRgb(hex: string): string {
  hex = hex.replace('#', '')

  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }

  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return `${r}, ${g}, ${b}`
}

export const ensureUnits = (val: string | number | undefined, defaultVal: string) => {
  if (!val) return defaultVal
  const strVal = String(val)
  return /^\d+$/.test(strVal) ? `${strVal}px` : strVal
}

export function extractNumericValue(value: string | undefined): string {
  if (!value) return '0'
  const match = value.toString().match(/(\d+(?:\.\d+)?)/)
  return match ? match[1] : '0'
}
