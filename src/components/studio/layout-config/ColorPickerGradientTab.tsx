'use client'

import { HexColorPicker } from 'react-colorful'
import { Move, Plus, Trash2, Circle } from 'lucide-react'
import { TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getSwatchStyle } from './color-utils'

export function ColorPickerGradientTab(props: any) {
  const {
    isSpaceLayoutConfig,
    gradientConfig,
    handleGradientChange,
    gradientValue,
    addGradientStop,
    selectedGradientStopIndex,
    setSelectedGradientStopIndex,
    extractBaseColor,
    updateGradientStop,
    removeGradientStop,
    extractOpacity,
    hexToRgba,
  } = props

  return (              <TabsContent value="gradient" className={`${isSpaceLayoutConfig ? 'py-4' : 'p-4'} space-y-2 mt-0`}>
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
                      {gradientConfig.stops.map((stop: any, index: number) => {
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

  )
}
