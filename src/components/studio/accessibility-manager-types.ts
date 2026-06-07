export interface AccessibilityIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  severity: 'high' | 'medium' | 'low'
  category: 'color' | 'contrast' | 'keyboard' | 'screen-reader' | 'focus' | 'alt-text' | 'semantic'
  title: string
  description: string
  element?: string
  suggestion: string
  automated: boolean
  fixed: boolean
}

export interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusIndicators: boolean
  colorBlindSupport: boolean
  fontSize: number
  contrastRatio: number
  animationSpeed: number
  soundEffects: boolean
  voiceNavigation: boolean
  autoFocus: boolean
  skipLinks: boolean
  ariaLabels: boolean
  semanticHTML: boolean
}
