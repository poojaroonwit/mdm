'use client'

import { TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ColorSwatchGrid } from './ColorPickerPopoverParts'

export function ColorPickerSolidTab(props: any) {
  const {
    isSpaceLayoutConfig,
    selectedColorSet,
    setSelectedColorSet,
    recentColors,
    favoriteColors,
    colorPalettes,
    quickColors,
    solidColor,
    handleSolidColorChange,
    showColorFormats,
    setShowColorFormats,
    colorInputRef,
    solidColorSwatchButtonRefCallback,
    actualColor,
    extractBaseColor,
    extractOpacity,
    handleOpacityChange,
    opacity,
    finalInputClassName,
    disabled,
    solidColorTextInputRefCallback,
    getColorFormats,
  } = props

  return (              <TabsContent value="solid" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
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
                      colors={colors as string[]}
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

  )
}
