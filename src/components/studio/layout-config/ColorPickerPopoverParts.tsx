'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { SWATCH_SIZE } from './color-utils'
// Global styles for color input trigger button (same as ColorInput)
export const COLOR_INPUT_TRIGGER_STYLES = `
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
export const COLOR_SET_SELECTOR_STYLES = `
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
export const COLOR_SWATCH_STYLES = `
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
export const ColorSwatchGrid = React.memo(({
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

export function applySolidColorSwatchStyles(button: HTMLButtonElement, swatchStyle: React.CSSProperties) {
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

  button.style.removeProperty('background')
  button.style.removeProperty('background-color')
  button.style.removeProperty('background-image')
  button.style.removeProperty('background-size')
  button.style.removeProperty('background-position')
  button.style.removeProperty('background-repeat')

  if (swatchStyle.background) {
    button.style.setProperty('background', String(swatchStyle.background), 'important')
    return
  }

  button.style.setProperty(
    'background-color',
    String(swatchStyle.backgroundColor || '#e5e5e5'),
    'important'
  )
  if (swatchStyle.backgroundImage) {
    button.style.setProperty('background-image', String(swatchStyle.backgroundImage), 'important')
  }
  if (swatchStyle.backgroundSize) {
    button.style.setProperty('background-size', String(swatchStyle.backgroundSize), 'important')
  }
  if (swatchStyle.backgroundPosition) {
    button.style.setProperty('background-position', String(swatchStyle.backgroundPosition), 'important')
  }
  if (swatchStyle.backgroundRepeat) {
    button.style.setProperty('background-repeat', String(swatchStyle.backgroundRepeat), 'important')
  }
}

