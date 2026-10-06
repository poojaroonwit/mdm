type LooseConfig = Record<string, any>

const CHAT_WINDOW_RADIUS_KEYS = [
  'chatWindowBorderRadiusTopLeft',
  'chatWindowBorderRadiusTopRight',
  'chatWindowBorderRadiusBottomRight',
  'chatWindowBorderRadiusBottomLeft',
] as const

function hasConfigValue(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

function normalizeCssDimension(value: unknown, fallback: string): string {
  if (!hasConfigValue(value)) return fallback
  const text = String(value).trim()
  return /^-?\d+(?:\.\d+)?$/.test(text) ? `${text}px` : text
}

/**
 * The compact widget appearance editor historically used popoverWidth,
 * popoverHeight and popoverBorderRadius while the renderer/persistence layer
 * uses chatWindow*. Canonicalize the legacy names at every runtime boundary so
 * draft previews, saved versions and published embeds all render the same.
 */
export function normalizePopoverAppearanceConfig<T extends LooseConfig>(config: T): T {
  const normalized = { ...config } as LooseConfig

  if (hasConfigValue(normalized.popoverWidth)) {
    normalized.chatWindowWidth = normalized.popoverWidth
  }
  if (hasConfigValue(normalized.popoverHeight)) {
    normalized.chatWindowHeight = normalized.popoverHeight
  }
  if (hasConfigValue(normalized.popoverBorderRadius)) {
    const radius = normalized.popoverBorderRadius
    normalized.chatWindowBorderRadius = radius
    for (const key of CHAT_WINDOW_RADIUS_KEYS) normalized[key] = radius
  }

  // Keep one source of truth after the compatibility conversion.
  delete normalized.popoverWidth
  delete normalized.popoverHeight
  delete normalized.popoverBorderRadius

  return normalized as T
}

/**
 * Resolve the visible popover radius. Older edits can leave four identical
 * corner values behind while only the linked/global radius changes. When every
 * corner is identical but disagrees with the global radius, the global value
 * is the newer linked value and should win.
 */
export function resolveChatWindowBorderRadius(config: LooseConfig, defaultRadius = '12px'): string {
  const normalized = normalizePopoverAppearanceConfig(config || {})
  const baseRadius = normalizeCssDimension(
    normalized.chatWindowBorderRadius ?? normalized.borderRadius,
    defaultRadius
  )

  const rawCorners = CHAT_WINDOW_RADIUS_KEYS.map((key) => normalized[key])
  const hasGranularRadius = rawCorners.some(hasConfigValue)
  if (!hasGranularRadius) return baseRadius

  const cornerValues = rawCorners.map((value) => normalizeCssDimension(value, baseRadius))
  const allCornersExplicit = rawCorners.every(hasConfigValue)
  const allCornersEqual = cornerValues.every((value) => value === cornerValues[0])

  if (allCornersExplicit && allCornersEqual && cornerValues[0] !== baseRadius) {
    return baseRadius
  }

  return cornerValues.join(' ')
}
