'use client'

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, Video, Image, Play, Droplet, Plus, Trash2, Move, Copy, Check, Eye, Star, Sliders, Grid3x3, Circle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { COLOR_PATTERNS, getPatternById, getSwatchStyle, SWATCH_SIZE } from './color-utils'
import { HexColorPicker } from 'react-colorful'

// Global styles for color input trigger button (same as ColorInput)
const COLOR_INPUT_TRIGGER_STYLES = `
  body:not([data-space]) button.color-input-trigger,
  body:not([data-space]) button.color-input-trigger[type="button"] {
    width: ${SWATCH_SIZE.width} !important;
    height: ${SWATCH_SIZE.height} !important;
    min-width: ${SWATCH_SIZE.minWidth} !important;
    min-height: ${SWATCH_SIZE.minHeight} !important;
    max-width: ${SWATCH_SIZE.maxWidth} !important;
    max-height: ${SWATCH_SIZE.maxHeight} !important;
    border: none !important;
    border-width: 0 !important;
    border-style: none !important;
    border-color: transparent !important;
    outline: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
    border-radius: 0 !important;
    aspect-ratio: 1 / 1 !important;
  }
`

// Global styles for color set selector - no border, shadow, or background, exclude from theme config
const COLOR_SET_SELECTOR_STYLES = `
  body:not([data-space]) button[data-component="select-trigger"].color-set-selector,
  body:not([data-space]) button[data-component="select-trigger"].color-set-selector[type="button"],
  body:not([data-space]) [data-component="select-trigger"].color-set-selector {
    border: none !important;
    border-width: 0 !important;
    border-style: none !important;
    border-color: transparent !important;
    box-shadow: none !important;
    background: transparent !important;
    background-color: transparent !important;
    outline: none !important;
  }
  
  /* Preset palette buttons - exclude from theme config but keep their own borders */
  body:not([data-space]) button.color-palette-swatch,
  body:not([data-space]) button.color-palette-swatch[type="button"] {
    /* Allow borders to be set by className, but prevent theme config from overriding */
    box-shadow: none !important;
  }
`

// Global styles for color swatch buttons to ensure 1:1 aspect ratio and circular shape
const COLOR_SWATCH_STYLES = `
  .color-picker-swatch-button {
    aspect-ratio: 1 / 1 !important;
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    min-height: 24px !important;
    max-width: 24px !important;
    max-height: 24px !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    border-radius: 50% !important;
  }
  .color-picker-swatch-container {
    display: grid !important;
    grid-template-columns: repeat(8, minmax(0, 1fr)) !important;
    gap: 6px !important;
    align-items: center !important;
  }
  body:not([data-space]) button.solid-color-swatch-button,
  body:not([data-space]) button.solid-color-swatch-button[type="button"],
  body:not([data-space]) button[type="button"].solid-color-swatch-button,
  body:not([data-space]) button.solid-color-swatch-button.absolute,
  body:not([data-space]) button.solid-color-swatch-button[class*="absolute"] {
    aspect-ratio: 1 / 1 !important;
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    min-height: 24px !important;
    max-width: 24px !important;
    max-height: 24px !important;
    padding: 0 !important;
    margin: 0 !important;
    box-sizing: border-box !important;
    border: none !important;
    border-width: 0 !important;
    border-style: none !important;
    border-color: transparent !important;
    border-top-width: 0 !important;
    border-right-width: 0 !important;
    border-bottom-width: 0 !important;
    border-left-width: 0 !important;
    outline: none !important;
    box-shadow: none !important;
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
    flex-basis: 24px !important;
    display: block !important;
    position: absolute !important;
    line-height: 0 !important;
    vertical-align: middle !important;
  }
  
  /* Override any Tailwind classes that might affect size */
  body:not([data-space]) button.solid-color-swatch-button.h-6,
  body:not([data-space]) button.solid-color-swatch-button.w-6,
  body:not([data-space]) button.solid-color-swatch-button.h-5,
  body:not([data-space]) button.solid-color-swatch-button.w-5,
  body:not([data-space]) button.solid-color-swatch-button.h-7,
  body:not([data-space]) button.solid-color-swatch-button.w-7,
  body:not([data-space]) button.solid-color-swatch-button[class*="h-"],
  body:not([data-space]) button.solid-color-swatch-button[class*="w-"] {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
    min-height: 24px !important;
    max-width: 24px !important;
    max-height: 24px !important;
  }
`

// Swatch button component that ensures background color is applied
const ColorSwatchButton = React.memo(({
  color,
  isSelected,
  onClick
}: {
  color: string
  isSelected: boolean
  onClick: () => void
}) => {
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (buttonRef.current) {
      const size = '24px'
      buttonRef.current.style.setProperty('background-color', color, 'important')
      buttonRef.current.style.setProperty('background', color, 'important')
      buttonRef.current.style.setProperty('background-image', color, 'important')
      buttonRef.current.style.setProperty('border', 'none', 'important')
      buttonRef.current.style.setProperty('border-width', '0', 'important')
      buttonRef.current.style.setProperty('aspect-ratio', '1 / 1', 'important')
      buttonRef.current.style.setProperty('width', size, 'important')
      buttonRef.current.style.setProperty('height', size, 'important')
      buttonRef.current.style.setProperty('min-width', size, 'important')
      buttonRef.current.style.setProperty('min-height', size, 'important')
      buttonRef.current.style.setProperty('max-width', size, 'important')
      buttonRef.current.style.setProperty('max-height', size, 'important')
      buttonRef.current.style.setProperty('padding', '0', 'important')
      buttonRef.current.style.setProperty('box-sizing', 'border-box', 'important')
      buttonRef.current.style.setProperty('border-radius', '50%', 'important')
    }
  }, [color])

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={`color-picker-swatch-button transition-all hover:scale-110 ${isSelected
        ? 'ring-2 ring-blue-500/20'
        : ''
        }`}
      style={{
        border: 'none',
        aspectRatio: '1 / 1',
        width: '24px',
        height: '24px',
        minWidth: '24px',
        minHeight: '24px',
        maxWidth: '24px',
        maxHeight: '24px',
        padding: 0,
        boxSizing: 'border-box'
      }}
      title={color}
    >
      {isSelected && (
        <div className="w-2 h-2 bg-background rounded-full mx-auto shadow-lg border border-border" />
      )}
    </button>
  )
})
ColorSwatchButton.displayName = 'ColorSwatchButton'

// Shared component for rendering color swatch grids
const ColorSwatchGrid = React.memo(({
  colors,
  selectedColor,
  onColorSelect,
  showFavoriteIcon = false
}: {
  colors: string[]
  selectedColor: string
  onColorSelect: (color: string) => void
  showFavoriteIcon?: boolean
}) => {
  if (colors.length === 0) return null

  return (
    <div className="color-picker-swatch-container">
      {colors.map((color, index) => (
        showFavoriteIcon ? (
          <div key={color} className="relative">
            <ColorSwatchButton
              color={color}
              isSelected={selectedColor.toLowerCase() === color.toLowerCase()}
              onClick={() => onColorSelect(color)}
            />
            <Star className="absolute -top-1 -right-1 h-3 w-3 fill-yellow-400 text-yellow-400 pointer-events-none z-10" />
          </div>
        ) : (
          <ColorSwatchButton
            key={`${color}-${index}`}
            color={color}
            isSelected={selectedColor.toLowerCase() === color.toLowerCase()}
            onClick={() => onColorSelect(color)}
          />
        )
      ))}
    </div>
  )
})
ColorSwatchGrid.displayName = 'ColorSwatchGrid'

interface ColorPickerPopoverProps {
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  disabled?: boolean
  allowImageVideo?: boolean // Only show Image/Video tabs for background/fill
  isSpaceLayoutConfig?: boolean // If true, items display on separate lines full width with no left/right padding
}

export function ColorPickerPopover({
  value,
  onChange,
  children,
  disabled,
  allowImageVideo = false,
  isSpaceLayoutConfig = false,
}: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Recent colors stored in localStorage
  const RECENT_COLORS_KEY = 'color-picker-recent-colors'
  const FAVORITE_COLORS_KEY = 'color-picker-favorite-colors'
  const MAX_RECENT_COLORS = 8

  const getRecentColors = (): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(RECENT_COLORS_KEY)
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const getFavoriteColors = (): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(FAVORITE_COLORS_KEY)
      const parsed = stored ? JSON.parse(stored) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // Parse value to determine type and extract the actual value
  const parseValue = (val: string) => {
    if (!val) return { type: 'solid', extracted: '#ffffff' }

    if (val.startsWith('#') || /^rgb|^rgba/.test(val)) {
      return { type: 'solid', extracted: val }
    } else if (val.startsWith('linear-gradient') || val.startsWith('radial-gradient')) {
      return { type: 'gradient', extracted: val }
    } else if (val.startsWith('pattern(')) {
      const match = val.match(/pattern\(([^)]+)\)/)
      return { type: 'pattern', extracted: match ? match[1] : 'dots' }
    } else if (val.startsWith('url(')) {
      const urlMatch = val.match(/url\(['"]?([^'"]+)['"]?\)/)
      return { type: 'image', extracted: urlMatch ? urlMatch[1] : '' }
    } else if (val.startsWith('video(')) {
      const videoMatch = val.match(/video\(['"]?([^'"]+)['"]?\)/)
      return { type: 'video', extracted: videoMatch ? videoMatch[1] : '' }
    } else if (val.startsWith('http') && /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(val)) {
      return { type: 'image', extracted: val }
    } else if (val.startsWith('http') && /\.(mp4|webm|ogg)$/i.test(val)) {
      return { type: 'video', extracted: val }
    }
    return { type: 'solid', extracted: val }
  }

  // Helper to convert hex to rgba
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // Helper to convert rgba to hex (ignoring alpha)
  const rgbaToHex = (rgba: string): string => {
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0')
      const g = parseInt(match[2]).toString(16).padStart(2, '0')
      const b = parseInt(match[3]).toString(16).padStart(2, '0')
      return `#${r}${g}${b}`
    }
    return rgba
  }

  // Helper to convert hex to RGB
  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Helper to convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0, s = 0
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
      l: Math.round(l * 100)
    }
  }

  // Get color in different formats
  const getColorFormats = () => {
    const baseColor = extractBaseColor(solidColor)
    const rgb = hexToRgb(baseColor)
    if (!rgb) return { hex: baseColor, rgb: '', hsl: '' }

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const rgbStr = opacity < 1
      ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity.toFixed(2)})`
      : `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
    const hslStr = opacity < 1
      ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${opacity.toFixed(2)})`
      : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`

    return {
      hex: opacity < 1 ? hexToRgba(baseColor, opacity) : baseColor,
      rgb: rgbStr,
      hsl: hslStr
    }
  }

  // Helper to extract opacity from rgba/rgb
  const extractOpacity = (color: string): number => {
    if (color.startsWith('rgba')) {
      const match = color.match(/rgba\([^)]+,\s*([\d.]+)\)/)
      if (match) return parseFloat(match[1])
    }
    return 1 // Default to fully opaque
  }

  // Helper to extract base color (hex or rgb without alpha)
  const extractBaseColor = (color: string): string => {
    if (color.startsWith('rgba')) {
      return rgbaToHex(color)
    }
    if (color.startsWith('rgb')) {
      return rgbaToHex(color)
    }
    return color
  }

  const parsed = parseValue(value)

  // Recent colors functions (must be after extractBaseColor is defined)
  const addToRecentColors = (color: string) => {
    // Only add solid colors (hex/rgb) to recent colors, not gradients/patterns
    if (color.startsWith('#') || color.startsWith('rgb')) {
      const baseColor = extractBaseColor(color)
      // Use functional update to avoid stale closure
      setRecentColors((prevColors) => {
        // Filter out existing color (case-insensitive) to prevent duplicates like #FFF and #fff
        const filtered = prevColors.filter(c => c.toLowerCase() !== baseColor.toLowerCase())
        // Add new color to the beginning
        const updated = [baseColor, ...filtered].slice(0, MAX_RECENT_COLORS)

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated))
          } catch {
            // Ignore localStorage errors
          }
        }
        return updated
      })
    }
  }

  const handleColorChange = (color: string) => {
    onChange(color)
    addToRecentColors(color)
  }

  const copyColorToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = value
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Ignore copy errors
      }
      document.body.removeChild(textArea)
    }
  }

  // Toggle favorite color
  const toggleFavorite = (color: string) => {
    const baseColor = extractBaseColor(color)
    const isFavorite = favoriteColors.includes(baseColor)
    const updated = isFavorite
      ? favoriteColors.filter(c => c !== baseColor)
      : [...favoriteColors, baseColor].slice(0, 12) // Max 12 favorites

    setFavoriteColors(updated)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FAVORITE_COLORS_KEY, JSON.stringify(updated))
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  const isFavorite = (color: string): boolean => {
    const baseColor = extractBaseColor(color)
    return favoriteColors.includes(baseColor)
  }

  // Eye dropper tool
  const startEyeDropper = async () => {
    if (!('EyeDropper' in window)) {
      // Fallback: show message or use alternative method
      alert('Eye dropper is not supported in your browser. Please use Chrome, Edge, or Safari 18+')
      return
    }

    try {
      setIsPickingColor(true)
      // @ts-ignore - EyeDropper API
      const eyeDropper = new EyeDropper()
      const result = await eyeDropper.open()
      if (result.sRGBHex) {
        handleSolidColorChange(result.sRGBHex)
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Eye dropper error:', err)
      }
    } finally {
      setIsPickingColor(false)
    }
  }
  // If image/video is not allowed but value is image/video, default to solid
  const initialType = parsed.type
  const safeType = (!allowImageVideo && (initialType === 'image' || initialType === 'video')) ? 'solid' : initialType
  const [colorType, setColorType] = useState<'solid' | 'gradient' | 'pattern' | 'image' | 'video'>(safeType as any)
  const baseSolidColor = parsed.type === 'solid' ? extractBaseColor(parsed.extracted) : '#ffffff'
  const [solidColor, setSolidColor] = useState(baseSolidColor)
  const [opacity, setOpacity] = useState(parsed.type === 'solid' ? extractOpacity(parsed.extracted) : 1)
  const [recentColors, setRecentColors] = useState<string[]>(getRecentColors())
  const [favoriteColors, setFavoriteColors] = useState<string[]>(getFavoriteColors())
  const [showColorFormats, setShowColorFormats] = useState(false)
  const [isPickingColor, setIsPickingColor] = useState(false)

  // Track selected stop for gradient editing
  const [selectedGradientStopIndex, setSelectedGradientStopIndex] = useState(0)

  // Default to 'recent' if available, otherwise 'quick'
  // Quick colors array
  const quickColors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#1e40af', '#6366f1', '#8b5cf6', '#a855f7',
    '#d946ef', '#ec4899', '#f43f5e', '#6b7280', '#64748b', '#71717a', '#737373', '#78716c',
    '#1e40af', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#ea580c', '#0891b2', '#be123c'
  ]

  const [selectedColorSet, setSelectedColorSet] = useState<string>(
    recentColors.length > 0 ? 'recent' : 'quick'
  )

  // Refs for color picker inputs
  const colorInputRef = React.useRef<HTMLInputElement>(null)
  const solidColorTextInputRef = React.useRef<HTMLInputElement>(null)
  const solidColorSwatchButtonRef = React.useRef<HTMLButtonElement>(null)
  const gradientColorInputRefs = React.useRef<Map<number, HTMLInputElement>>(new Map())

  // Recalculate swatch style when solidColor or opacity changes (same as ColorInput)
  // This needs to be before the callback ref so it can use it
  const actualColor = React.useMemo(() => {
    return opacity < 1 ? hexToRgba(solidColor, opacity) : solidColor
  }, [solidColor, opacity])

  const swatchStyle = React.useMemo(() => getSwatchStyle(actualColor), [actualColor])

  // Callback ref to apply size and background styles immediately when button is mounted.
  // swatchStyle is included as a dependency so React re-calls this with the fresh button
  // element whenever the color changes, keeping the swatch in sync.
  const solidColorSwatchButtonRefCallback = React.useCallback((button: HTMLButtonElement | null) => {
    solidColorSwatchButtonRef.current = button
    if (!button) return

    // Apply size styles immediately when button is available (always 1:1)
    const size = '20px'
    button.style.setProperty('aspect-ratio', '1 / 1', 'important')
    button.style.setProperty('width', size, 'important')
    button.style.setProperty('height', size, 'important')
    button.style.setProperty('min-width', size, 'important')
    button.style.setProperty('min-height', size, 'important')
    button.style.setProperty('max-width', size, 'important')
    button.style.setProperty('max-height', size, 'important')
    button.style.setProperty('padding', '0', 'important')
    button.style.setProperty('margin', '0', 'important')
    button.style.setProperty('border', 'none', 'important')
    button.style.setProperty('border-width', '0', 'important')
    button.style.setProperty('border-radius', '0', 'important')
    button.style.setProperty('box-sizing', 'border-box', 'important')

    // Apply background/swatch styles immediately so the color shows on first open
    button.style.removeProperty('background')
    button.style.removeProperty('background-color')
    button.style.removeProperty('background-image')
    button.style.removeProperty('background-size')
    button.style.removeProperty('background-position')
    button.style.removeProperty('background-repeat')

    if (swatchStyle.background) {
      button.style.setProperty('background', String(swatchStyle.background), 'important')
    } else {
      if (swatchStyle.backgroundColor) {
        button.style.setProperty('background-color', swatchStyle.backgroundColor, 'important')
      } else {
        button.style.setProperty('background-color', '#e5e5e5', 'important')
      }
      if (swatchStyle.backgroundImage) {
        button.style.setProperty('background-image', swatchStyle.backgroundImage, 'important')
      }
      if (swatchStyle.backgroundSize) {
        button.style.setProperty('background-size', String(swatchStyle.backgroundSize), 'important')
      }
      if (swatchStyle.backgroundPosition) {
        button.style.setProperty('background-position', String(swatchStyle.backgroundPosition), 'important')
      }
      if (swatchStyle.backgroundRepeat) {
        button.style.setProperty('background-repeat', swatchStyle.backgroundRepeat, 'important')
      }
    }
  }, [swatchStyle])

  // Calculate proper padding: button width (20px) + left offset (4px) + gap (6px) = 30px
  // Using 6px gap to ensure no overlap (same as ColorInput)
  const BUTTON_WIDTH = 20
  const BUTTON_LEFT_OFFSET = 4
  const BUTTON_TEXT_GAP = 6
  const INPUT_LEFT_PADDING = BUTTON_WIDTH + BUTTON_LEFT_OFFSET + BUTTON_TEXT_GAP // 30px

  const DEFAULT_INPUT_CLASS_NAME = `h-7 text-xs w-full rounded-[2px] bg-input border-0 focus:outline-none focus:ring-0 focus:border-0`

  // Build input className with proper left padding to avoid button overlap (same as ColorInput)
  const finalInputClassName = DEFAULT_INPUT_CLASS_NAME

  // Callback ref to set padding immediately when input is available (same as ColorInput)
  const solidColorTextInputRefCallback = React.useCallback((input: HTMLInputElement | null) => {
    solidColorTextInputRef.current = input
    if (input) {
      // Set padding-left with !important to override any className padding
      input.style.setProperty('padding-left', `${INPUT_LEFT_PADDING}px`, 'important')
    }
  }, [])

  // Reapply padding when component updates (same as ColorInput)
  React.useEffect(() => {
    const input = solidColorTextInputRef.current
    if (input) {
      // Reapply padding to ensure it's always correct
      input.style.setProperty('padding-left', `${INPUT_LEFT_PADDING}px`, 'important')
    }
  }, [solidColor, opacity])

  // Apply swatch styles to button with !important - same approach as ColorInput
  // This function applies all styles and can be called multiple times
  const applyButtonStyles = React.useCallback(() => {
    const button = solidColorSwatchButtonRef.current
    if (!button) return

    // Force strict 1:1 aspect ratio - set width and height to be exactly equal (same as ColorInput)
    const size = '20px'
    button.style.setProperty('aspect-ratio', '1 / 1', 'important')
    button.style.setProperty('width', size, 'important')
    button.style.setProperty('height', size, 'important')
    button.style.setProperty('min-width', size, 'important')
    button.style.setProperty('min-height', size, 'important')
    button.style.setProperty('max-width', size, 'important')
    button.style.setProperty('max-height', size, 'important')
    button.style.setProperty('padding', '0', 'important')
    button.style.setProperty('margin', '0', 'important')
    button.style.setProperty('border', 'none', 'important')
    button.style.setProperty('border-width', '0', 'important')
    button.style.setProperty('border-radius', '0', 'important')
    button.style.setProperty('box-sizing', 'border-box', 'important')

    // Clear any existing background styles first
    button.style.removeProperty('background')
    button.style.removeProperty('background-color')
    button.style.removeProperty('background-image')
    button.style.removeProperty('background-size')
    button.style.removeProperty('background-position')
    button.style.removeProperty('background-repeat')

    // Apply swatch styles with !important (same as ColorInput)
    if (swatchStyle.background) {
      // For gradients, use the background shorthand
      button.style.setProperty('background', String(swatchStyle.background), 'important')
    } else {
      // For other types, use individual properties
      if (swatchStyle.backgroundColor) {
        button.style.setProperty('background-color', swatchStyle.backgroundColor, 'important')
      } else {
        button.style.setProperty('background-color', '#e5e5e5', 'important')
      }
      if (swatchStyle.backgroundImage) {
        button.style.setProperty('background-image', swatchStyle.backgroundImage, 'important')
      }
      if (swatchStyle.backgroundSize) {
        button.style.setProperty('background-size', String(swatchStyle.backgroundSize), 'important')
      }
      if (swatchStyle.backgroundPosition) {
        button.style.setProperty('background-position', String(swatchStyle.backgroundPosition), 'important')
      }
      if (swatchStyle.backgroundRepeat) {
        button.style.setProperty('background-repeat', swatchStyle.backgroundRepeat, 'important')
      }
    }
  }, [swatchStyle])

  // Apply styles immediately on mount and whenever swatchStyle changes (same as ColorInput)
  React.useEffect(() => {
    const button = solidColorSwatchButtonRef.current
    if (!button) return

    // Force strict 1:1 aspect ratio - set width and height to be exactly equal (same as ColorInput)
    const size = '20px'
    button.style.setProperty('aspect-ratio', '1 / 1', 'important')
    button.style.setProperty('width', size, 'important')
    button.style.setProperty('height', size, 'important')
    button.style.setProperty('min-width', size, 'important')
    button.style.setProperty('min-height', size, 'important')
    button.style.setProperty('max-width', size, 'important')
    button.style.setProperty('max-height', size, 'important')
    button.style.setProperty('padding', '0', 'important')
    button.style.setProperty('margin', '0', 'important')
    button.style.setProperty('border', 'none', 'important')
    button.style.setProperty('border-width', '0', 'important')
    button.style.setProperty('border-radius', '0', 'important')
    button.style.setProperty('box-sizing', 'border-box', 'important')

    // Clear any existing background styles first
    button.style.removeProperty('background')
    button.style.removeProperty('background-color')
    button.style.removeProperty('background-image')
    button.style.removeProperty('background-size')
    button.style.removeProperty('background-position')
    button.style.removeProperty('background-repeat')

    // Apply swatch styles with !important (same as ColorInput)
    if (swatchStyle.background) {
      // For gradients, use the background shorthand
      button.style.setProperty('background', String(swatchStyle.background), 'important')
    } else {
      // For other types, use individual properties
      if (swatchStyle.backgroundColor) {
        button.style.setProperty('background-color', swatchStyle.backgroundColor, 'important')
      } else {
        button.style.setProperty('background-color', '#e5e5e5', 'important')
      }
      if (swatchStyle.backgroundImage) {
        button.style.setProperty('background-image', swatchStyle.backgroundImage, 'important')
      }
      if (swatchStyle.backgroundSize) {
        button.style.setProperty('background-size', String(swatchStyle.backgroundSize), 'important')
      }
      if (swatchStyle.backgroundPosition) {
        button.style.setProperty('background-position', String(swatchStyle.backgroundPosition), 'important')
      }
      if (swatchStyle.backgroundRepeat) {
        button.style.setProperty('background-repeat', swatchStyle.backgroundRepeat, 'important')
      }
    }
  }, [swatchStyle])

  // Auto-switch to valid set if current becomes unavailable (only when selectedColorSet changes, not when colors are added)
  React.useEffect(() => {
    // Only auto-switch if the current set becomes unavailable
    // This effect only runs when selectedColorSet changes, not when recentColors/favoriteColors change
    // This prevents the color set from changing when you adjust a custom color
    if (selectedColorSet === 'recent' && recentColors.length === 0) {
      setSelectedColorSet('quick')
    } else if (selectedColorSet === 'favorites' && favoriteColors.length === 0) {
      setSelectedColorSet('quick')
    }
  }, [selectedColorSet]) // Only depend on selectedColorSet, not on recentColors/favoriteColors length

  // Parse gradient into editable structure
  const parseGradient = (gradStr: string) => {
    if (!gradStr) return { type: 'linear', angle: 0, stops: [{ color: '#ff0000', position: 0 }, { color: '#0000ff', position: 100 }] }

    const isLinear = gradStr.includes('linear-gradient')
    const isRadial = gradStr.includes('radial-gradient')

    // Extract angle/direction
    let angle = 0
    if (isLinear) {
      const angleMatch = gradStr.match(/(\d+)deg/)
      if (angleMatch) angle = parseInt(angleMatch[1])
      else if (gradStr.includes('to top')) angle = 0
      else if (gradStr.includes('to right')) angle = 90
      else if (gradStr.includes('to bottom')) angle = 180
      else if (gradStr.includes('to left')) angle = 270
    }

    // Extract color stops - robust handling for nested parens (rgba/rgb)
    const firstParen = gradStr.indexOf('(')
    const lastParen = gradStr.lastIndexOf(')')

    const stops: Array<{ color: string; position: number }> = []

    if (firstParen !== -1 && lastParen !== -1) {
      const content = gradStr.substring(firstParen + 1, lastParen)

      // Split by comma ONLY if not inside parentheses (lookahead for closing paren without opening paren)
      const parts = content.split(/,(?![^(]*\))/).map(s => s.trim())

      parts.forEach(part => {
        // Skip angle/direction parts
        if (part.includes('deg') || part.startsWith('to ')) return

        const colorMatch = part.match(/(#[0-9a-fA-F]{6}|rgb\([^)]+\)|rgba\([^)]+\)|[a-z]+)/i)
        const posMatch = part.match(/(\d+)%/)

        if (colorMatch) {
          stops.push({
            color: colorMatch[1],
            position: posMatch ? parseInt(posMatch[1]) : stops.length === 0 ? 0 : 100
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
      stops
    }
  }

  const [gradientConfig, setGradientConfig] = useState(() => parseGradient(parsed.type === 'gradient' ? parsed.extracted : ''))
  const [patternValue, setPatternValue] = useState(parsed.type === 'pattern' ? parsed.extracted : '')

  // Get current pattern from value
  const getCurrentPattern = () => {
    if (!patternValue) return COLOR_PATTERNS[0]
    return COLOR_PATTERNS.find((p) => {
      // Try to match by name or id
      return patternValue.toLowerCase().includes(p.id) || patternValue.toLowerCase().includes(p.name.toLowerCase())
    }) || COLOR_PATTERNS[0]
  }

  const currentPattern = getCurrentPattern()

  // Generate CSS pattern string
  const getPatternCSS = (pattern: typeof COLOR_PATTERNS[0]) => {
    return pattern.css
  }

  // Generate full background pattern style
  const getPatternStyle = (pattern: typeof COLOR_PATTERNS[0]) => {
    return {
      backgroundImage: getPatternCSS(pattern),
      backgroundSize: pattern.size
    }
  }
  const [imageUrl, setImageUrl] = useState(parsed.type === 'image' ? parsed.extracted : '')
  const [videoUrl, setVideoUrl] = useState(parsed.type === 'video' ? parsed.extracted : '')
  const isInternalUpdateRef = React.useRef(false)

  // Preset color palettes
  const colorPalettes: Record<string, string[]> = {
    'Material Design': [
      '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
      '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
      '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
      '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#000000', '#FFFFFF'
    ],
    'Tailwind': [
      '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
      '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
      '#1e40af', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
      '#EC4899', '#F43F5E', '#6B7280', '#64748B', '#000000', '#FFFFFF'
    ],
    'Pastel': [
      '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
      '#E0BBE4', '#FEC8D8', '#FFDFD3', '#D5F4E6', '#F0E6FF',
      '#FFE5F1', '#E8F5E9', '#FFF3E0', '#E1F5FE', '#F3E5F5',
      '#FFE0B2', '#C5E1A5', '#B2EBF2', '#F8BBD0', '#FFFFFF'
    ],
    'Grayscale': [
      '#000000', '#1A1A1A', '#333333', '#4D4D4D', '#666666',
      '#808080', '#999999', '#B3B3B3', '#CCCCCC', '#E6E6E6',
      '#FFFFFF'
    ]
  }

  // Build gradient string from config
  const buildGradientString = (config: typeof gradientConfig) => {
    const sortedStops = [...config.stops].sort((a, b) => a.position - b.position)
    const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ')
    if (config.type === 'radial') {
      return `radial-gradient(circle, ${stopsStr})`
    }
    return `linear-gradient(${config.angle}deg, ${stopsStr})`
  }

  const gradientValue = buildGradientString(gradientConfig)

  // Update state when value changes externally
  React.useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false
      return
    }

    const parsed = parseValue(value)
    // If image/video is not allowed but value is image/video, default to solid
    const safeType = (!allowImageVideo && (parsed.type === 'image' || parsed.type === 'video')) ? 'solid' : parsed.type
    setColorType(safeType as any)
    if (parsed.type === 'solid' || (!allowImageVideo && (parsed.type === 'image' || parsed.type === 'video'))) {
      // If image/video is not allowed, convert to solid color
      if (!allowImageVideo && (parsed.type === 'image' || parsed.type === 'video')) {
        setSolidColor('#ffffff')
        setOpacity(1)
      } else {
        const baseColor = extractBaseColor(parsed.extracted)
        setSolidColor(baseColor)
        setOpacity(extractOpacity(parsed.extracted))
      }
    }
    if (parsed.type === 'gradient') setGradientConfig(parseGradient(parsed.extracted))
    if (parsed.type === 'pattern') setPatternValue(parsed.extracted)
    if (allowImageVideo) {
      if (parsed.type === 'image') setImageUrl(parsed.extracted)
      if (parsed.type === 'video') setVideoUrl(parsed.extracted)
    }
  }, [value, allowImageVideo])

  const handleSolidColorChange = (color: string) => {
    isInternalUpdateRef.current = true
    const baseColor = extractBaseColor(color)
    setSolidColor(baseColor)
    // Apply current opacity
    if (opacity < 1) {
      const rgbaColor = hexToRgba(baseColor, opacity)
      handleColorChange(rgbaColor)
    } else {
      handleColorChange(baseColor)
    }
  }

  const handleOpacityChange = (newOpacity: number) => {
    isInternalUpdateRef.current = true
    setOpacity(newOpacity)
    if (newOpacity < 1) {
      const rgbaColor = hexToRgba(solidColor, newOpacity)
      handleColorChange(rgbaColor)
    } else {
      handleColorChange(solidColor)
    }
  }

  const handleGradientChange = (config: typeof gradientConfig) => {
    isInternalUpdateRef.current = true
    setGradientConfig(config)
    handleColorChange(buildGradientString(config))
  }

  const addGradientStop = () => {
    const newConfig = {
      ...gradientConfig,
      stops: [...gradientConfig.stops, { color: '#000000', position: 50 }]
    }
    handleGradientChange(newConfig)
  }

  const removeGradientStop = (index: number) => {
    if (gradientConfig.stops.length <= 2) return // Keep at least 2 stops
    const newConfig = {
      ...gradientConfig,
      stops: gradientConfig.stops.filter((_, i) => i !== index)
    }
    handleGradientChange(newConfig)
  }

  const updateGradientStop = (index: number, updates: Partial<{ color: string; position: number }>) => {
    const newConfig = {
      ...gradientConfig,
      stops: gradientConfig.stops.map((stop, i) => i === index ? { ...stop, ...updates } : stop)
    }
    handleGradientChange(newConfig)
  }

  const handlePatternChange = (patternId: string) => {
    isInternalUpdateRef.current = true
    const selectedPattern = getPatternById(patternId) || COLOR_PATTERNS[0]
    setPatternValue(selectedPattern.id)
    // Store the pattern ID, parent can use it to generate the CSS
    handleColorChange(`pattern(${selectedPattern.id})`)
  }

  const handleImageChange = (url: string) => {
    isInternalUpdateRef.current = true
    setImageUrl(url)
    const finalUrl = url.startsWith('http') || url.startsWith('data:') ? `url(${url})` : url
    handleColorChange(finalUrl)
  }

  const handleVideoChange = (url: string) => {
    isInternalUpdateRef.current = true
    setVideoUrl(url)
    const finalUrl = url.startsWith('http') || url.startsWith('data:') ? `video(${url})` : url
    handleColorChange(finalUrl)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        handleImageChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        handleVideoChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <style>{COLOR_INPUT_TRIGGER_STYLES}</style>
      <style>{COLOR_SET_SELECTOR_STYLES}</style>
      <style>{COLOR_SWATCH_STYLES}</style>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          {children}
        </PopoverTrigger>
        <PopoverContent
          className={`w-[360px] ${isSpaceLayoutConfig ? 'px-0' : 'p-0'}`}
          align="start"
          onClick={(e) => e.stopPropagation()}
          style={{ width: '360px', minWidth: '360px', maxWidth: '360px' }}
        >
          <div className={`w-full ${isSpaceLayoutConfig ? 'space-y-2' : ''}`}>
            <Tabs value={colorType} onValueChange={(v) => setColorType(v as any)}>
              <div className="mb-2">
                <TabsList className={`w-full grid h-9 px-2 mt-2 mb-2 ${allowImageVideo ? 'grid-cols-5' : 'grid-cols-3'}`}>
                  <TabsTrigger value="solid" className="text-xs px-3 py-2 mx-1 inline-flex items-center justify-center gap-1.5 h-full rounded-t-md transition-colors hover:bg-muted/50 relative" title="Solid">
                    <Droplet className="h-4 w-4 flex-shrink-0" />
                    <span>Solid</span>
                    {colorType === 'solid' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                  </TabsTrigger>
                  <TabsTrigger value="gradient" className="text-xs px-3 py-2 mx-1 inline-flex items-center justify-center gap-1.5 h-full rounded-t-md transition-colors hover:bg-muted/50 relative" title="Gradient">
                    <Sliders className="h-4 w-4 flex-shrink-0" />
                    <span>Gradient</span>
                    {colorType === 'gradient' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                  </TabsTrigger>
                  <TabsTrigger value="pattern" className="text-xs px-3 py-2 mx-1 inline-flex items-center justify-center gap-1.5 h-full rounded-t-md transition-colors hover:bg-muted/50 relative" title="Pattern">
                    <Grid3x3 className="h-4 w-4 flex-shrink-0" />
                    <span>Pattern</span>
                    {colorType === 'pattern' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                  </TabsTrigger>
                  {allowImageVideo && (
                    <>
                      <TabsTrigger value="image" className="text-xs px-3 py-2 mx-1 inline-flex items-center justify-center gap-1.5 h-full rounded-t-md transition-colors hover:bg-muted/50 relative" title="Image">
                        <Image className="h-4 w-4 flex-shrink-0" />
                        <span>Image</span>
                        {colorType === 'image' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                      </TabsTrigger>
                      <TabsTrigger value="video" className="text-xs px-3 py-2 mx-1 inline-flex items-center justify-center gap-1.5 h-full rounded-t-md transition-colors hover:bg-muted/50 relative" title="Video">
                        <Play className="h-4 w-4 flex-shrink-0" />
                        <span>Video</span>
                        {colorType === 'video' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              </div>

              <TabsContent value="solid" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
                {/* Color Set Selector */}
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs">Color Set</Label>
                  <Select value={selectedColorSet} onValueChange={setSelectedColorSet}>
                    <SelectTrigger
                      className="h-7 text-xs w-32 border-0 shadow-none bg-transparent color-set-selector"
                      data-component="select-trigger"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick Colors</SelectItem>
                      {recentColors.length > 0 && <SelectItem value="recent">Recent Colors</SelectItem>}
                      {favoriteColors.length > 0 && <SelectItem value="favorites">Favorites</SelectItem>}
                      {Object.keys(colorPalettes).map((name) => (
                        <SelectItem key={name} value={name.toLowerCase().replace(/\s+/g, '-')}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Colors */}
                {selectedColorSet === 'quick' && (
                  <ColorSwatchGrid
                    colors={quickColors}
                    selectedColor={solidColor}
                    onColorSelect={handleSolidColorChange}
                  />
                )}

                {/* Recent Colors */}
                {selectedColorSet === 'recent' && (
                  <ColorSwatchGrid
                    colors={recentColors}
                    selectedColor={solidColor}
                    onColorSelect={handleSolidColorChange}
                  />
                )}

                {/* Favorite Colors */}
                {selectedColorSet === 'favorites' && (
                  <ColorSwatchGrid
                    colors={favoriteColors}
                    selectedColor={solidColor}
                    onColorSelect={handleSolidColorChange}
                    showFavoriteIcon={true}
                  />
                )}

                {/* Preset Palettes */}
                {Object.entries(colorPalettes)
                  .filter(([name]) => {
                    const paletteKey = name.toLowerCase().replace(/\s+/g, '-')
                    return selectedColorSet === paletteKey
                  })
                  .map(([name, colors]) => (
                    <ColorSwatchGrid
                      key={name}
                      colors={colors}
                      selectedColor={solidColor}
                      onColorSelect={handleSolidColorChange}
                    />
                  ))}

                {/* Custom Color Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Custom Color</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-xs"
                        onClick={() => setShowColorFormats(!showColorFormats)}
                        title="Show color formats"
                      >
                        {showColorFormats ? 'Hide' : 'Formats'}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Color input with swatch button inside - same UI as ColorInput */}
                    <div className="relative flex-1">
                      {/* Hidden color input */}
                      <input
                        ref={colorInputRef}
                        type="color"
                        value={solidColor}
                        onChange={(e) => {
                          e.stopPropagation()
                          handleSolidColorChange(e.target.value)
                        }}
                        style={{
                          position: 'absolute',
                          width: '1px',
                          height: '1px',
                          opacity: 0,
                          clip: 'rect(0, 0, 0, 0)',
                          overflow: 'hidden',
                          zIndex: -1,
                          pointerEvents: 'auto' // Allow programmatic clicks
                        }}
                        tabIndex={-1}
                      />
                      {/* Color swatch button that triggers native color picker - same as ColorInput */}
                      <button
                        ref={solidColorSwatchButtonRefCallback}
                        type="button"
                        data-component="color-input-trigger"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          if (colorInputRef.current) {
                            colorInputRef.current.click()
                          }
                        }}
                        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-pointer z-40 border-0 outline-none shadow-none flex-shrink-0 p-0 color-input-trigger"
                        style={{
                          pointerEvents: 'auto',
                          zIndex: 40,
                          display: 'block',
                        }}
                        title="Click to open color picker"
                        aria-label="Open color picker"
                      />
                      <Input
                        ref={solidColorTextInputRefCallback}
                        type="text"
                        value={actualColor}
                        onChange={(e) => {
                          // Parse the input - if it's rgba, extract the base color
                          const inputValue = e.target.value
                          if (inputValue.startsWith('rgba')) {
                            // Extract base color from rgba
                            const baseColor = extractBaseColor(inputValue)
                            handleSolidColorChange(baseColor)
                            // Update opacity from rgba
                            const newOpacity = extractOpacity(inputValue)
                            if (newOpacity !== opacity) {
                              handleOpacityChange(newOpacity)
                            }
                          } else {
                            // Regular hex or rgb color
                            handleSolidColorChange(inputValue)
                          }
                        }}
                        className={finalInputClassName}
                        placeholder="#ffffff"
                        disabled={disabled}
                        style={{
                          pointerEvents: 'auto'
                        }}
                        onPointerDown={(e) => {
                          // Don't prevent pointer events on the input itself, but allow button clicks
                          const target = e.target as HTMLElement
                          if (target.closest('button')) {
                            return
                          }
                        }}
                      />
                    </div>

                    {/* Opacity input on the right */}
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={Math.round(opacity * 100)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0
                        const clamped = Math.max(0, Math.min(100, val))
                        handleOpacityChange(clamped / 100)
                      }}
                      className="h-8 w-16 text-xs"
                      placeholder="100"
                    />
                    <span className="text-xs text-muted-foreground">%</span>
                  </div>

                  {/* Color Format Display */}
                  {showColorFormats && (
                    <div className="space-y-1 pt-1 border-t">
                      {(() => {
                        const formats = getColorFormats()
                        return (
                          <>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">HEX:</span>
                              <code className="font-mono text-[10px]">{formats.hex}</code>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">RGB:</span>
                              <code className="font-mono text-[10px]">{formats.rgb}</code>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">HSL:</span>
                              <code className="font-mono text-[10px]">{formats.hsl}</code>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>

              </TabsContent>

              <TabsContent value="gradient" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
                <div className="space-y-4">
                  {/* Gradient Type */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={gradientConfig.type}
                      onValueChange={(value: string) => handleGradientChange({ ...gradientConfig, type: value as 'linear' | 'radial' })}
                    >
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <div className="flex items-center gap-2">
                          {gradientConfig.type === 'linear' ? (
                            <Move className="h-3.5 w-3.5" />
                          ) : (
                            <Circle className="h-3.5 w-3.5" />
                          )}
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">
                          <div className="flex items-center gap-2">
                            <Move className="h-3.5 w-3.5" />
                            <span>Linear</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="radial">
                          <div className="flex items-center gap-2">
                            <Circle className="h-3.5 w-3.5" />
                            <span>Radial</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Angle for linear gradients */}
                    {gradientConfig.type === 'linear' && (
                      <div className="flex items-center gap-2 w-24">
                        <Input
                          type="number"
                          value={gradientConfig.angle}
                          onChange={(e) => handleGradientChange({ ...gradientConfig, angle: parseInt(e.target.value) || 0 })}
                          className="h-8 text-xs px-2"
                          min={0}
                          max={360}
                          step={1}
                        />
                        <span className="text-xs text-muted-foreground">deg</span>
                      </div>
                    )}
                  </div>

                  {/* Preview Bar */}
                  <div className="space-y-1">
                    <div
                      className="w-full h-8 rounded border"
                      style={{ background: gradientValue }}
                    />
                  </div>

                  {/* Stops List & Picker */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Color Stops</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={addGradientStop}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Stop
                      </Button>
                    </div>

                    {/* Stops List */}
                    <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                      {gradientConfig.stops.map((stop, index) => {
                        const isActive = selectedGradientStopIndex === index;
                        return (
                          <div
                            key={`stop-${index}-${stop.position}`}
                            className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer transition-colors ${isActive ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted'
                              }`}
                            onClick={() => setSelectedGradientStopIndex(index)}
                          >
                            <div
                              className="w-6 h-6 rounded border shadow-lg flex-shrink-0"
                              style={getSwatchStyle(stop.color)}
                            />

                            <div className="flex-1 flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground flex-1">
                                {extractBaseColor(stop.color)}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">Pos:</span>
                                <Input
                                  type="number"
                                  value={stop.position}
                                  onChange={(e) => updateGradientStop(index, { position: parseInt(e.target.value) || 0 })}
                                  className="h-6 text-xs w-12 px-1 text-center"
                                  min={0}
                                  max={100}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="text-[10px] text-muted-foreground">%</span>
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeGradientStop(index);
                              }}
                              disabled={gradientConfig.stops.length <= 2}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>

                    {/* Color Picker for Active Stop */}
                    {gradientConfig.stops[selectedGradientStopIndex] && (
                      <div className="p-3 border rounded-lg bg-muted/20 space-y-3">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <HexColorPicker
                              color={extractBaseColor(gradientConfig.stops[selectedGradientStopIndex].color)}
                              onChange={(newBase) => {
                                const currentOpacity = extractOpacity(gradientConfig.stops[selectedGradientStopIndex].color);
                                const newColor = currentOpacity < 1 ? hexToRgba(newBase, currentOpacity) : newBase;
                                updateGradientStop(selectedGradientStopIndex, { color: newColor });
                              }}
                              style={{ width: '100%', height: '120px' }}
                            />
                          </div>
                          <div className="w-[80px] space-y-3">
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Opacity</Label>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={Math.round(extractOpacity(gradientConfig.stops[selectedGradientStopIndex].color) * 100)}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    const clamped = Math.max(0, Math.min(100, val));
                                    const newOpacity = clamped / 100;
                                    const base = extractBaseColor(gradientConfig.stops[selectedGradientStopIndex].color);
                                    // Handle hex base only
                                    if (base.startsWith('#')) {
                                      const newColor = newOpacity < 1 ? hexToRgba(base, newOpacity) : base;
                                      updateGradientStop(selectedGradientStopIndex, { color: newColor });
                                    }
                                  }}
                                  className="h-7 text-xs px-1 text-center"
                                />
                                <span className="text-[10px]">%</span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Hex</Label>
                              <Input
                                value={extractBaseColor(gradientConfig.stops[selectedGradientStopIndex].color)}
                                onChange={(e) => {
                                  const newBase = e.target.value;
                                  if (/^#[0-9A-F]{6}$/i.test(newBase)) {
                                    const currentOpacity = extractOpacity(gradientConfig.stops[selectedGradientStopIndex].color);
                                    const newColor = currentOpacity < 1 ? hexToRgba(newBase, currentOpacity) : newBase;
                                    updateGradientStop(selectedGradientStopIndex, { color: newColor });
                                  }
                                }}
                                className="h-7 text-xs px-1 font-mono uppercase"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pattern" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
                <div className="space-y-2">
                  <Label className="text-xs">Pattern</Label>
                  <Select value={currentPattern.id} onValueChange={handlePatternChange}>
                    <SelectTrigger className="h-8 text-xs">
                      <div className="flex items-center gap-2">
                        {React.createElement(currentPattern.icon, { className: "h-3.5 w-3.5" })}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PATTERNS.map((pattern) => {
                        const Icon = pattern.icon
                        return (
                          <SelectItem key={pattern.id} value={pattern.id}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" />
                              <span>{pattern.name}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>

                  {/* Pattern Preview */}
                  <div className="space-y-1">
                    <Label className="text-xs">Preview</Label>
                    <div
                      className="w-full h-16 rounded border bg-background"
                      style={getPatternStyle(currentPattern)}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="image" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={imageUrl.replace(/^url\(|\)$/g, '')}
                    onChange={(e) => handleImageChange(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Image URL or upload"
                  />
                  <label className="block">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        const input = document.getElementById(`image-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`) as HTMLInputElement
                        input?.click()
                      }}
                    >
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                      Upload Image
                    </Button>
                    <input
                      id={`image-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  {imageUrl && (
                    <div className="w-full h-24 rounded border overflow-hidden">
                      <img src={imageUrl.replace(/^url\(|\)$/g, '')} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="video" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={videoUrl.replace(/^video\(|\)$/g, '')}
                    onChange={(e) => handleVideoChange(e.target.value)}
                    className="h-8 text-xs"
                    placeholder="Video URL or upload"
                  />
                  <label className="block">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => {
                        const input = document.getElementById(`video-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`) as HTMLInputElement
                        input?.click()
                      }}
                    >
                      <Video className="h-3.5 w-3.5 mr-1.5" />
                      Upload Video
                    </Button>
                    <input
                      id={`video-upload-${value.replace(/[^a-zA-Z0-9]/g, '')}`}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                  </label>
                  {videoUrl && (
                    <div className="w-full h-24 rounded border overflow-hidden">
                      <video src={videoUrl.replace(/^video\(|\)$/g, '')} className="w-full h-full object-cover" controls={false} />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

