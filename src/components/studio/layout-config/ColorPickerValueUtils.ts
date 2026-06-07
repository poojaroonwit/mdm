export const quickColors = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#1e40af', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#6b7280', '#64748b', '#71717a', '#737373', '#78716c',
  '#1e40af', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#ea580c', '#0891b2', '#be123c',
]

export const colorPalettes: Record<string, string[]> = {
  'Material Design': [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#000000', '#FFFFFF',
  ],
  Tailwind: [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
    '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
    '#1e40af', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
    '#EC4899', '#F43F5E', '#6B7280', '#64748B', '#000000', '#FFFFFF',
  ],
  Pastel: [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
    '#E0BBE4', '#FEC8D8', '#FFDFD3', '#D5F4E6', '#F0E6FF',
    '#FFE5F1', '#E8F5E9', '#FFF3E0', '#E1F5FE', '#F3E5F5',
    '#FFE0B2', '#C5E1A5', '#B2EBF2', '#F8BBD0', '#FFFFFF',
  ],
  Grayscale: [
    '#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666',
    '#808080', '#999999', '#B3B3B3', '#CCCCCC', '#E6E6E6',
    '#FFFFFF',
  ],
}

export function parsePickerValue(val: string) {
  if (!val) return { type: 'solid', extracted: '#ffffff' }
  if (val.startsWith('#') || /^rgb|^rgba/.test(val)) return { type: 'solid', extracted: val }
  if (val.startsWith('linear-gradient') || val.startsWith('radial-gradient')) return { type: 'gradient', extracted: val }
  if (val.startsWith('pattern(')) {
    const match = val.match(/pattern\(([^)]+)\)/)
    return { type: 'pattern', extracted: match ? match[1] : 'dots' }
  }
  if (val.startsWith('url(')) {
    const urlMatch = val.match(/url\(['"]?([^'"]+)['"]?\)/)
    return { type: 'image', extracted: urlMatch ? urlMatch[1] : '' }
  }
  if (val.startsWith('video(')) {
    const videoMatch = val.match(/video\(['"]?([^'"]+)['"]?\)/)
    return { type: 'video', extracted: videoMatch ? videoMatch[1] : '' }
  }
  if (val.startsWith('http') && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(val)) return { type: 'image', extracted: val }
  if (val.startsWith('http') && /\.(mp4|webm|ogg)$/i.test(val)) return { type: 'video', extracted: val }
  return { type: 'solid', extracted: val }
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function rgbaToHex(rgba: string): string {
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return rgba
  const r = parseInt(match[1]).toString(16).padStart(2, '0')
  const g = parseInt(match[2]).toString(16).padStart(2, '0')
  const b = parseInt(match[3]).toString(16).padStart(2, '0')
  return `#${r}${g}${b}`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

export function parseGradient(gradStr: string) {
  if (!gradStr) return { type: 'linear', angle: 0, stops: [{ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 }] }

  const isLinear = gradStr.includes('linear-gradient')
  const isRadial = gradStr.includes('radial-gradient')
  let angle = 0
  if (isLinear) {
    const angleMatch = gradStr.match(/(\d+)deg/)
    if (angleMatch) angle = parseInt(angleMatch[1])
    else if (gradStr.includes('to top')) angle = 0
    else if (gradStr.includes('to right')) angle = 90
    else if (gradStr.includes('to bottom')) angle = 180
    else if (gradStr.includes('to left')) angle = 270
  }

  const firstParen = gradStr.indexOf('(')
  const lastParen = gradStr.lastIndexOf(')')
  const stops: Array<{ color: string; position: number }> = []

  if (firstParen !== -1 && lastParen !== -1) {
    const content = gradStr.substring(firstParen + 1, lastParen)
    const parts = content.split(/,(?![^(]*\))/).map(s => s.trim())
    parts.forEach(part => {
      if (part.includes('deg') || part.startsWith('to ')) return
      const colorMatch = part.match(/(#[0-9a-fA-F]{6}|rgb\([^)]+\)|rgba\([^)]+\)|[a-z]+)/i)
      const posMatch = part.match(/(\d+)%/)
      if (colorMatch) {
        stops.push({
          color: colorMatch[1],
          position: posMatch ? parseInt(posMatch[1]) : stops.length === 0 ? 0 : 100,
        })
      }
    })
  }

  if (stops.length === 0) {
    stops.push({ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 })
  }

  return {
    type: isRadial ? 'radial' : 'linear',
    angle,
    stops,
  }
}
