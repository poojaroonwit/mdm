'use client'

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Image, Play, Droplet, Sliders, Grid3x3 } from 'lucide-react'
import { COLOR_PATTERNS, getPatternById, getSwatchStyle } from './color-utils'

import { COLOR_INPUT_TRIGGER_STYLES, COLOR_SET_SELECTOR_STYLES, COLOR_SWATCH_STYLES, applySolidColorSwatchStyles } from './ColorPickerPopoverParts'
import { ColorPickerSolidTab } from './ColorPickerSolidTab'
import { ColorPickerGradientTab } from './ColorPickerGradientTab'
import { ColorPickerPatternMediaTabs } from './ColorPickerPatternMediaTabs'
import {
  colorPalettes,
  hexToRgb,
  hexToRgba,
  parseGradient,
  parsePickerValue,
  quickColors,
  rgbaToHex,
  rgbToHsl,
} from './ColorPickerValueUtils'
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

  const parsed = parsePickerValue(value)

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

  // Track selected stop for gradient editing
  const [selectedGradientStopIndex, setSelectedGradientStopIndex] = useState(0)

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
    if (button) applySolidColorSwatchStyles(button, swatchStyle)
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

  // Apply styles immediately on mount and whenever swatchStyle changes (same as ColorInput)
  React.useEffect(() => {
    const button = solidColorSwatchButtonRef.current
    if (button) applySolidColorSwatchStyles(button, swatchStyle)
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

    const parsed = parsePickerValue(value)
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

              <ColorPickerSolidTab
                isSpaceLayoutConfig={isSpaceLayoutConfig}
                selectedColorSet={selectedColorSet}
                setSelectedColorSet={setSelectedColorSet}
                recentColors={recentColors}
                favoriteColors={favoriteColors}
                colorPalettes={colorPalettes}
                quickColors={quickColors}
                solidColor={solidColor}
                handleSolidColorChange={handleSolidColorChange}
                showColorFormats={showColorFormats}
                setShowColorFormats={setShowColorFormats}
                colorInputRef={colorInputRef}
                solidColorSwatchButtonRefCallback={solidColorSwatchButtonRefCallback}
                actualColor={actualColor}
                extractBaseColor={extractBaseColor}
                extractOpacity={extractOpacity}
                handleOpacityChange={handleOpacityChange}
                opacity={opacity}
                finalInputClassName={finalInputClassName}
                disabled={disabled}
                solidColorTextInputRefCallback={solidColorTextInputRefCallback}
                getColorFormats={getColorFormats}
              />

              <ColorPickerGradientTab
                isSpaceLayoutConfig={isSpaceLayoutConfig}
                gradientConfig={gradientConfig}
                handleGradientChange={handleGradientChange}
                gradientValue={gradientValue}
                addGradientStop={addGradientStop}
                selectedGradientStopIndex={selectedGradientStopIndex}
                setSelectedGradientStopIndex={setSelectedGradientStopIndex}
                extractBaseColor={extractBaseColor}
                updateGradientStop={updateGradientStop}
                removeGradientStop={removeGradientStop}
                extractOpacity={extractOpacity}
                hexToRgba={hexToRgba}
              />

              <ColorPickerPatternMediaTabs
                isSpaceLayoutConfig={isSpaceLayoutConfig}
                currentPattern={currentPattern}
                handlePatternChange={handlePatternChange}
                getPatternStyle={getPatternStyle}
                imageUrl={imageUrl}
                handleImageChange={handleImageChange}
                value={value}
                handleImageUpload={handleImageUpload}
                videoUrl={videoUrl}
                handleVideoChange={handleVideoChange}
                handleVideoUpload={handleVideoUpload}
              />            </Tabs>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

