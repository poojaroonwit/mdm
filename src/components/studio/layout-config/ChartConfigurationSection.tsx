'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { BarChart3, Type, Layout, Eye, Tag, MoveVertical, Square, Box, Layers, Grid3x3, HelpCircle, Palette, DollarSign, TrendingUp, Plus } from 'lucide-react'
import { PlacedWidget } from './widgets'
import { ColorInput } from './ColorInput'
import { MultiSideInput } from '@/components/shared/MultiSideInput'

interface ChartConfigurationSectionProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
}

export function ChartConfigurationSection({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
}: ChartConfigurationSectionProps) {
  const updateProperty = (key: string, value: any) => {
    setPlacedWidgets(prev => prev.map(w => 
      w.id === selectedWidgetId 
        ? { ...w, properties: { ...w.properties, [key]: value } }
        : w
    ))
  }

  const chartType = widget.properties?.chartType || widget.type.replace('-chart', '')
  const isPieDonut = chartType === 'pie' || chartType === 'donut'
  const isBarLineArea = chartType === 'bar' || chartType === 'line' || chartType === 'area'
  const hasAxes = isBarLineArea || chartType === 'scatter'
  
  // Get measures for series configuration
  const measures = widget.properties?.measures || []
  const seriesStyles = widget.properties?.seriesStyles || {}

  return (
    <>
      {/* Chart Style - Looker Studio style (Chart type) */}
      <AccordionItem value="chart-style" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Chart style</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Chart type</Label>
              <Select
                value={chartType}
                onValueChange={(value) => updateProperty('chartType', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="donut">Donut Chart</SelectItem>
                  <SelectItem value="scatter">Scatter Plot</SelectItem>
                  <SelectItem value="radar">Radar Chart</SelectItem>
                  <SelectItem value="gauge">Gauge Chart</SelectItem>
                  <SelectItem value="funnel">Funnel Chart</SelectItem>
                  <SelectItem value="waterfall">Waterfall Chart</SelectItem>
                  <SelectItem value="treemap">Treemap</SelectItem>
                  <SelectItem value="heatmap">Heatmap</SelectItem>
                  <SelectItem value="bubble">Bubble Map</SelectItem>
                  <SelectItem value="combo">Combo Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Common options for chart subtypes */}
            {chartType === 'bar' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Bar mode</Label>
                  <Select
                    value={widget.properties?.barMode || 'grouped'}
                    onValueChange={(value) => updateProperty('barMode', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grouped">Grouped</SelectItem>
                      <SelectItem value="stacked">Stacked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Orientation</Label>
                  <Select
                    value={widget.properties?.barOrientation || 'vertical'}
                    onValueChange={(value) => updateProperty('barOrientation', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vertical">Vertical</SelectItem>
                      <SelectItem value="horizontal">Horizontal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {chartType === 'line' || chartType === 'area' ? (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Curve</Label>
                <Select
                  value={widget.properties?.lineCurve || 'monotone'}
                  onValueChange={(value) => updateProperty('lineCurve', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monotone">Smooth</SelectItem>
                    <SelectItem value="linear">Straight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Title - Looker Studio style */}
      <AccordionItem value="title" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <Type className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Title</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Show Header</Label>
                <p className="text-xs text-muted-foreground">Display header above chart</p>
              </div>
              <Switch
                checked={widget.properties?.showHeader ?? true}
                onCheckedChange={(checked) => updateProperty('showHeader', checked)}
              />
            </div>

            {(widget.properties?.showHeader ?? true) && (
              <>
                <Separator />
                
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Title Color</Label>
                      <ColorInput
                        value={widget.properties?.titleColor || '#111827'}
                        onChange={(color) => updateProperty('titleColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#111827"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Font Size</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={widget.properties?.titleFontSize || 14}
                          onChange={(e) => updateProperty('titleFontSize', parseInt(e.target.value) || 14)}
                          className="h-7 text-xs pr-8"
                          min="8"
                          max="32"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Header Background</Label>
                    <ColorInput
                      value={widget.properties?.headerBackgroundColor || '#ffffff'}
                      onChange={(color) => updateProperty('headerBackgroundColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#ffffff"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Text Alignment</Label>
                    <Select
                      value={widget.properties?.titleAlign || 'left'}
                      onValueChange={(value) => updateProperty('titleAlign', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Header Icon</Label>
                    <Select
                      value={widget.properties?.headerIcon || 'none'}
                      onValueChange={(value) => updateProperty('headerIcon', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="bar">Bar Chart</SelectItem>
                        <SelectItem value="line">Line Chart</SelectItem>
                        <SelectItem value="area">Area Chart</SelectItem>
                        <SelectItem value="pie">Pie Chart</SelectItem>
                        <SelectItem value="donut">Donut Chart</SelectItem>
                        <SelectItem value="scatter">Scatter Plot</SelectItem>
                        <SelectItem value="radar">Radar Chart</SelectItem>
                        <SelectItem value="gauge">Gauge Chart</SelectItem>
                        <SelectItem value="funnel">Funnel Chart</SelectItem>
                        <SelectItem value="waterfall">Waterfall Chart</SelectItem>
                        <SelectItem value="treemap">Treemap</SelectItem>
                        <SelectItem value="heatmap">Heatmap</SelectItem>
                        <SelectItem value="bubble">Bubble Chart</SelectItem>
                        <SelectItem value="combo">Combo Chart</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Series - Looker Studio style */}
      {(isBarLineArea || chartType === 'scatter') && measures.length > 0 && (
        <AccordionItem value="series" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Series</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              {measures.map((measure: string, index: number) => {
                const seriesStyle = seriesStyles[measure] || {}
                return (
                  <div key={measure} className="space-y-2 pb-2 border-b last:border-0">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">{measure}</Label>
                      <span className="text-xs text-muted-foreground">Series {index + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Color</Label>
                        <ColorInput
                          value={seriesStyle.color || '#0088FE'}
                          onChange={(color) => {
                            const newSeriesStyles = {
                              ...seriesStyles,
                              [measure]: {
                                ...seriesStyle,
                                color: color
                              }
                            }
                            updateProperty('seriesStyles', newSeriesStyles)
                          }}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#0088FE"
                          inputClassName="h-7 text-xs pl-7 w-full"
                        />
                      </div>
                      {chartType === 'line' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Line width</Label>
                          <Input
                            type="number"
                            value={seriesStyle.strokeWidth || 2}
                            onChange={(e) => {
                              const newSeriesStyles = {
                                ...seriesStyles,
                                [measure]: {
                                  ...seriesStyle,
                                  strokeWidth: parseInt(e.target.value) || 2
                                }
                              }
                              updateProperty('seriesStyles', newSeriesStyles)
                            }}
                            className="h-7 text-xs"
                            min="1"
                            max="10"
                          />
                        </div>
                      )}
                      {chartType === 'bar' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Bar size</Label>
                          <div className="relative">
                            <Input
                              type="number"
                              value={seriesStyle.barSize || ''}
                              onChange={(e) => {
                                const newSeriesStyles = {
                                  ...seriesStyles,
                                  [measure]: {
                                    ...seriesStyle,
                                    barSize: e.target.value ? parseInt(e.target.value) : undefined
                                  }
                                }
                                updateProperty('seriesStyles', newSeriesStyles)
                              }}
                              placeholder="Auto"
                              className="h-7 text-xs pr-8"
                              min="10"
                              max="100"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {chartType === 'line' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium">Show points</Label>
                          <Switch
                            checked={seriesStyle.showDots !== false}
                            onCheckedChange={(checked) => {
                              const newSeriesStyles = {
                                ...seriesStyles,
                                [measure]: {
                                  ...seriesStyle,
                                  showDots: checked
                                }
                              }
                              updateProperty('seriesStyles', newSeriesStyles)
                            }}
                          />
                        </div>
                        {seriesStyle.showDots !== false && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Point size</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                value={seriesStyle.dotRadius || 4}
                                onChange={(e) => {
                                  const newSeriesStyles = {
                                    ...seriesStyles,
                                    [measure]: {
                                      ...seriesStyle,
                                      dotRadius: parseInt(e.target.value) || 4
                                    }
                                  }
                                  updateProperty('seriesStyles', newSeriesStyles)
                                }}
                                className="h-7 text-xs pr-8"
                                min="2"
                                max="12"
                              />
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {chartType === 'area' && (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Opacity</Label>
                        <Input
                          type="number"
                          value={seriesStyle.fillOpacity ?? 0.6}
                          onChange={(e) => {
                            const newSeriesStyles = {
                              ...seriesStyles,
                              [measure]: {
                                ...seriesStyle,
                                fillOpacity: parseFloat(e.target.value) || 0.6
                              }
                            }
                            updateProperty('seriesStyles', newSeriesStyles)
                          }}
                          className="h-7 text-xs"
                          min="0"
                          max="1"
                          step="0.1"
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Legend - Looker Studio style */}
      <AccordionItem value="legend" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Legend</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Show</Label>
                <p className="text-xs text-muted-foreground">Display chart legend</p>
              </div>
              <Switch
                checked={widget.properties?.showLegend ?? true}
                onCheckedChange={(checked) => updateProperty('showLegend', checked)}
              />
            </div>
            {(widget.properties?.showLegend ?? true) && (
              <>
                <Separator />
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Position</Label>
                    <Select
                      value={widget.properties?.legendPosition || 'bottom'}
                      onValueChange={(value) => updateProperty('legendPosition', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Font Size</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={widget.properties?.legendFontSize || 12}
                          onChange={(e) => updateProperty('legendFontSize', parseInt(e.target.value) || 12)}
                          className="h-7 text-xs pr-8"
                          min="8"
                          max="24"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Color</Label>
                      <ColorInput
                        value={widget.properties?.legendColor || '#111827'}
                        onChange={(color) => updateProperty('legendColor', color)}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#111827"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Font Family</Label>
                    <Select
                      value={widget.properties?.legendFontFamily || 'Roboto'}
                      onValueChange={(value) => updateProperty('legendFontFamily', value)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Data labels - Looker Studio style */}
      {(isPieDonut || isBarLineArea) && (
        <AccordionItem value="dataLabels" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Data labels</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              {isPieDonut && (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Show</Label>
                    <p className="text-xs text-muted-foreground">Display values on slices</p>
                  </div>
                  <Switch
                    checked={widget.properties?.showLabels ?? true}
                    onCheckedChange={(checked) => updateProperty('showLabels', checked)}
                  />
                </div>
              )}
              {chartType === 'donut' && (
                <div className="space-y-1 pt-1">
                  <Label className="text-xs font-medium">Inner Radius (%)</Label>
                  <Input
                    type="number"
                    value={widget.properties?.innerRadius || 50}
                    onChange={(e) => updateProperty('innerRadius', parseInt(e.target.value) || 50)}
                    className="h-7 text-xs"
                    min="0"
                    max="90"
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Grid - Looker Studio style */}
      {hasAxes && (
        <AccordionItem value="grid" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Grid</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Show gridlines</Label>
                  <p className="text-xs text-muted-foreground">Display grid lines on chart</p>
                </div>
                <Switch
                  checked={widget.properties?.showGrid ?? true}
                  onCheckedChange={(checked) => updateProperty('showGrid', checked)}
                />
              </div>
              {(widget.properties?.showGrid ?? true) && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Grid color</Label>
                        <ColorInput
                          value={widget.properties?.gridColor || '#f0f0f0'}
                          onChange={(color) => updateProperty('gridColor', color)}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#f0f0f0"
                          inputClassName="h-7 text-xs pl-7 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Dash pattern</Label>
                        <Select
                          value={widget.properties?.gridDash || '3 3'}
                          onValueChange={(value) => updateProperty('gridDash', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0 0">Solid</SelectItem>
                            <SelectItem value="3 3">Dashed (3 3)</SelectItem>
                            <SelectItem value="5 5">Dashed (5 5)</SelectItem>
                            <SelectItem value="2 2">Dashed (2 2)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Table style */}
      {(widget.type === 'table' || widget.type === 'pivot-table') && (
        <AccordionItem value="table-style" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <Grid3x3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Table style</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-4">
              {/* Header styling */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Header</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Background</Label>
                    <ColorInput
                      value={widget.properties?.tableHeaderBg || '#f3f4f6'}
                      onChange={(color) => updateProperty('tableHeaderBg', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#f3f4f6"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Text color</Label>
                    <ColorInput
                      value={widget.properties?.tableHeaderText || '#111827'}
                      onChange={(color) => updateProperty('tableHeaderText', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Padding"
                    baseKey="tableHeaderPadding"
                    type="sides"
                    defaultValue={8}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableHeaderPadding${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableHeaderPadding ?? 8
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <MultiSideInput
                    label="Border width"
                    baseKey="tableHeaderBorderWidth"
                    type="sides"
                    defaultValue={1}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableHeaderBorderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableHeaderBorderWidth ?? 1
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Border color</Label>
                    <ColorInput
                      value={widget.properties?.tableHeaderBorderColor || '#e5e7eb'}
                      onChange={(color) => updateProperty('tableHeaderBorderColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableHeaderBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableHeaderBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableHeaderBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableHeaderBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableHeaderBorderRadius')) {
                          const corner = key.replace('tableHeaderBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableHeaderBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableHeaderBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Margin</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" max="24" value={widget.properties?.tableHeaderMargin ?? 0} onChange={(e) => updateProperty('tableHeaderMargin', parseInt(e.target.value) || 0)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row styling */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-xs font-semibold">Row</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Background</Label>
                    <ColorInput
                      value={widget.properties?.tableRowBg || '#ffffff'}
                      onChange={(color) => updateProperty('tableRowBg', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#ffffff"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Text color</Label>
                    <ColorInput
                      value={widget.properties?.tableRowText || '#111827'}
                      onChange={(color) => updateProperty('tableRowText', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Padding"
                    baseKey="tableRowPadding"
                    type="sides"
                    defaultValue={4}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableRowPadding${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableRowPadding ?? 4
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Margin</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" max="24" value={widget.properties?.tableRowMargin ?? 0} onChange={(e) => updateProperty('tableRowMargin', parseInt(e.target.value) || 0)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Spacing</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" max="24" value={widget.properties?.tableRowSpacing ?? 0} onChange={(e) => updateProperty('tableRowSpacing', parseInt(e.target.value) || 0)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Border width"
                    baseKey="tableRowBorderWidth"
                    type="sides"
                    defaultValue={1}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableRowBorderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableRowBorderWidth ?? 1
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Border color</Label>
                    <ColorInput
                      value={widget.properties?.tableRowBorderColor || '#e5e7eb'}
                      onChange={(color) => updateProperty('tableRowBorderColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableRowBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableRowBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableRowBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableRowBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableRowBorderRadius')) {
                          const corner = key.replace('tableRowBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableRowBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableRowBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                </div>
              </div>

              {/* Column styling */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-xs font-semibold">Column</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Background</Label>
                    <ColorInput
                      value={widget.properties?.tableColumnBg || 'transparent'}
                      onChange={(color) => updateProperty('tableColumnBg', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="transparent"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Text color</Label>
                    <ColorInput
                      value={widget.properties?.tableColumnText || '#111827'}
                      onChange={(color) => updateProperty('tableColumnText', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#111827"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Padding"
                    baseKey="tableColumnPadding"
                    type="sides"
                    defaultValue={4}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableColumnPadding${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableColumnPadding ?? 4
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Margin</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" max="24" value={widget.properties?.tableColumnMargin ?? 0} onChange={(e) => updateProperty('tableColumnMargin', parseInt(e.target.value) || 0)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Width</Label>
                    <div className="relative">
                      <Input type="number" className="h-7 text-xs pr-8" min="0" placeholder="Auto" value={widget.properties?.tableColumnWidth || ''} onChange={(e) => updateProperty('tableColumnWidth', e.target.value ? parseInt(e.target.value) : undefined)} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <MultiSideInput
                    label="Border width"
                    baseKey="tableColumnBorderWidth"
                    type="sides"
                    defaultValue={1}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableColumnBorderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableColumnBorderWidth ?? 1
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Border color</Label>
                    <ColorInput
                      value={widget.properties?.tableColumnBorderColor || '#e5e7eb'}
                      onChange={(color) => updateProperty('tableColumnBorderColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableColumnBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableColumnBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableColumnBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableColumnBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableColumnBorderRadius')) {
                          const corner = key.replace('tableColumnBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableColumnBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableColumnBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                </div>
              </div>

              {/* Cell styling */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-xs font-semibold">Cell</Label>
                <div className="grid grid-cols-2 gap-3">
                  <MultiSideInput
                    label="Padding"
                    baseKey="tableCellPadding"
                    type="sides"
                    defaultValue={4}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableCellPadding${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableCellPadding ?? 4
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                  <MultiSideInput
                    label="Border width"
                    baseKey="tableCellBorderWidth"
                    type="sides"
                    defaultValue={1}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const key = `tableCellBorderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
                      const baseValue = widget.properties?.tableCellBorderWidth ?? 1
                      const sideValue = widget.properties?.[key]
                      return sideValue !== undefined ? sideValue : baseValue
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const newProps = { ...props }
                      Object.keys(updates).forEach(key => {
                        const value = updates[key]
                        if (typeof value === 'string' && value.endsWith('px')) {
                          const numValue = parseInt(value.replace('px', '')) || 0
                          newProps[key] = numValue
                        } else {
                          newProps[key] = value
                        }
                      })
                      setPlacedWidgets(prev => prev.map(w => 
                        w.id === selectedWidgetId 
                          ? { ...w, properties: newProps }
                          : w
                      ))
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Border color</Label>
                    <ColorInput
                      value={widget.properties?.tableCellBorderColor || '#e5e7eb'}
                      onChange={(color) => updateProperty('tableCellBorderColor', color)}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#e5e7eb"
                      inputClassName="h-7 text-xs pl-7 w-full"
                    />
                  </div>
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableCellBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableCellBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableCellBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableCellBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableCellBorderRadius')) {
                          const corner = key.replace('tableCellBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableCellBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableCellBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                </div>
              </div>

              {/* Table styling */}
              <div className="space-y-2 border-t pt-3">
                <Label className="text-xs font-semibold">Table</Label>
                <div className="grid grid-cols-2 gap-3">
                  <MultiSideInput
                    label="Border radius"
                    baseKey="tableBorderRadius"
                    type="corners"
                    defaultValue={0}
                    inputClassName="h-7 text-xs"
                    getValue={(side: string) => {
                      const br = widget.properties?.tableBorderRadius
                      if (typeof br === 'number') return br
                      if (typeof br === 'object' && br !== null) {
                        const obj = br as any
                        const corner = obj[side]
                        return corner?.value ?? 0
                      }
                      return 0
                    }}
                    setValue={(updates) => {
                      const props = widget.properties || {}
                      const currentBr = props.tableBorderRadius
                      
                      let brObj: any = typeof currentBr === 'number' 
                        ? {
                            topLeft: { value: currentBr, unit: 'px' },
                            topRight: { value: currentBr, unit: 'px' },
                            bottomRight: { value: currentBr, unit: 'px' },
                            bottomLeft: { value: currentBr, unit: 'px' }
                          }
                        : (currentBr || {
                            topLeft: { value: 0, unit: 'px' },
                            topRight: { value: 0, unit: 'px' },
                            bottomRight: { value: 0, unit: 'px' },
                            bottomLeft: { value: 0, unit: 'px' }
                          })
                      
                      Object.keys(updates).forEach(key => {
                        if (key === 'tableBorderRadius') {
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj = {
                              topLeft: { value: numValue, unit: 'px' },
                              topRight: { value: numValue, unit: 'px' },
                              bottomRight: { value: numValue, unit: 'px' },
                              bottomLeft: { value: numValue, unit: 'px' }
                            }
                          }
                        } else if (key.startsWith('tableBorderRadius')) {
                          const corner = key.replace('tableBorderRadius', '').charAt(0).toLowerCase() + key.replace('tableBorderRadius', '').slice(1)
                          const value = updates[key]
                          if (typeof value === 'string' && value.endsWith('px')) {
                            const numValue = parseInt(value.replace('px', '')) || 0
                            brObj[corner] = { value: numValue, unit: 'px' }
                          }
                        }
                      })
                      
                      const allSame = brObj.topLeft.value === brObj.topRight.value &&
                                     brObj.topRight.value === brObj.bottomRight.value &&
                                     brObj.bottomRight.value === brObj.bottomLeft.value &&
                                     brObj.topLeft.unit === brObj.topRight.unit &&
                                     brObj.topRight.unit === brObj.bottomRight.unit &&
                                     brObj.bottomRight.unit === brObj.bottomLeft.unit
                      
                      updateProperty('tableBorderRadius', allSame ? brObj.topLeft.value : brObj)
                    }}
                  />
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Shadow</Label>
                    <Select value={widget.properties?.tableShadow || 'none'} onValueChange={(v) => updateProperty('tableShadow', v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Conditional formatting */}
      <AccordionItem value="conditional-formatting" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Conditional formatting</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="space-y-2">
              {(widget.properties?.conditionalFormattingRules || []).map((rule: any, index: number) => (
                <div key={rule.id || index} className="border rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Rule {index + 1}</Label>
                    <button
                      type="button"
                      onClick={() => {
                        const rules = widget.properties?.conditionalFormattingRules || []
                        updateProperty('conditionalFormattingRules', rules.filter((_: any, i: number) => i !== index))
                      }}
                      className="text-xs text-destructive hover:text-destructive/80"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Apply to</Label>
                        <Select
                          value={rule.applyTo || 'cell'}
                          onValueChange={(value) => {
                            const rules = widget.properties?.conditionalFormattingRules || []
                            const updated = [...rules]
                            updated[index] = { ...updated[index], applyTo: value }
                            updateProperty('conditionalFormattingRules', updated)
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cell">Cell</SelectItem>
                            <SelectItem value="row">Row</SelectItem>
                            <SelectItem value="column">Column</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Attribute</Label>
                        <Input
                          value={rule.attribute || ''}
                          onChange={(e) => {
                            const rules = widget.properties?.conditionalFormattingRules || []
                            const updated = [...rules]
                            updated[index] = { ...updated[index], attribute: e.target.value }
                            updateProperty('conditionalFormattingRules', updated)
                          }}
                          placeholder="Attribute name"
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Condition</Label>
                        <Select
                          value={rule.condition || 'greater_than'}
                          onValueChange={(value) => {
                            const rules = widget.properties?.conditionalFormattingRules || []
                            const updated = [...rules]
                            updated[index] = { ...updated[index], condition: value }
                            updateProperty('conditionalFormattingRules', updated)
                          }}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="greater_than">Greater than</SelectItem>
                            <SelectItem value="less_than">Less than</SelectItem>
                            <SelectItem value="equal_to">Equal to</SelectItem>
                            <SelectItem value="not_equal_to">Not equal to</SelectItem>
                            <SelectItem value="greater_or_equal">Greater or equal</SelectItem>
                            <SelectItem value="less_or_equal">Less or equal</SelectItem>
                            <SelectItem value="between">Between</SelectItem>
                            <SelectItem value="contains">Contains</SelectItem>
                            <SelectItem value="not_contains">Not contains</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Value</Label>
                        <Input
                          type="text"
                          value={rule.value || ''}
                          onChange={(e) => {
                            const rules = widget.properties?.conditionalFormattingRules || []
                            const updated = [...rules]
                            updated[index] = { ...updated[index], value: e.target.value }
                            updateProperty('conditionalFormattingRules', updated)
                          }}
                          placeholder="Value"
                          className="h-7 text-xs"
                        />
                      </div>
                      {rule.condition === 'between' && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Value 2</Label>
                          <Input
                            type="text"
                            value={rule.value2 || ''}
                            onChange={(e) => {
                              const rules = widget.properties?.conditionalFormattingRules || []
                              const updated = [...rules]
                              updated[index] = { ...updated[index], value2: e.target.value }
                              updateProperty('conditionalFormattingRules', updated)
                            }}
                            placeholder="Value 2"
                            className="h-7 text-xs"
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Background color</Label>
                        <ColorInput
                          value={rule.backgroundColor || '#ffffff'}
                          onChange={(color) => {
                            const rules = widget.properties?.conditionalFormattingRules || []
                            const updated = [...rules]
                            updated[index] = { ...updated[index], backgroundColor: color }
                            updateProperty('conditionalFormattingRules', updated)
                          }}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#ffffff"
                          inputClassName="h-7 text-xs pl-7 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Text color</Label>
                        <ColorInput
                          value={rule.textColor || '#111827'}
                          onChange={(color) => {
                            const rules = widget.properties?.conditionalFormattingRules || []
                            const updated = [...rules]
                            updated[index] = { ...updated[index], textColor: color }
                            updateProperty('conditionalFormattingRules', updated)
                          }}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#111827"
                          inputClassName="h-7 text-xs pl-7 w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const rules = widget.properties?.conditionalFormattingRules || []
                  const newRule = {
                    id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    applyTo: 'cell',
                    attribute: '',
                    condition: 'greater_than',
                    value: '',
                    backgroundColor: '#ffffff',
                    textColor: '#111827'
                  }
                  updateProperty('conditionalFormattingRules', [...rules, newRule])
                }}
                className="w-full px-3 py-2 text-xs border rounded hover:bg-accent flex items-center justify-center gap-2"
              >
                <Plus className="h-3 w-3" />
                Add rule
              </button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* X-axis - Looker Studio style */}
      {hasAxes && (
        <AccordionItem value="xAxis" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 no-underline hover:no-underline w-full">
            <div className="w-full">
              <div className="flex items-center gap-2">
                <MoveVertical className="h-3.5 w-3.5 text-muted-foreground rotate-90" />
                <span>X-axis</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Show</Label>
                  <p className="text-xs text-muted-foreground">Display X-axis</p>
                </div>
                <Switch
                  checked={widget.properties?.showXAxis ?? true}
                  onCheckedChange={(checked) => updateProperty('showXAxis', checked)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Title</Label>
                <Input
                  value={widget.properties?.xAxisLabel || ''}
                  onChange={(e) => updateProperty('xAxisLabel', e.target.value)}
                  placeholder="Enter X-axis title"
                  className="h-7 text-xs"
                />
              </div>
              {(widget.properties?.showXAxis ?? true) && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-1">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Title Font Size</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={widget.properties?.xAxisTitleFontSize || 12}
                          onChange={(e) => updateProperty('xAxisTitleFontSize', parseInt(e.target.value) || 12)}
                          className="h-7 text-xs pr-8"
                          min="8"
                          max="24"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Title Color</Label>
                        <ColorInput
                          value={widget.properties?.xAxisTitleColor || '#111827'}
                          onChange={(color) => updateProperty('xAxisTitleColor', color)}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#111827"
                          inputClassName="h-7 text-xs pl-7 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Tick Color</Label>
                        <ColorInput
                          value={widget.properties?.xAxisTickColor || '#111827'}
                          onChange={(color) => updateProperty('xAxisTickColor', color)}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#111827"
                          inputClassName="h-7 text-xs pl-7 w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Tick Font Size</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={widget.properties?.xAxisTickFontSize || 12}
                            onChange={(e) => updateProperty('xAxisTickFontSize', parseInt(e.target.value) || 12)}
                            className="h-7 text-xs pr-8"
                            min="8"
                            max="20"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Font Family</Label>
                        <Select
                          value={widget.properties?.xAxisFontFamily || 'Roboto'}
                          onValueChange={(value) => updateProperty('xAxisFontFamily', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Y-axis - Looker Studio style */}
      {hasAxes && (
        <AccordionItem value="yAxis" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 no-underline hover:no-underline w-full">
            <div className="w-full">
              <div className="flex items-center gap-2">
                <MoveVertical className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Y-axis</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-xs font-medium">Show</Label>
                  <p className="text-xs text-muted-foreground">Display Y-axis</p>
                </div>
                <Switch
                  checked={widget.properties?.showYAxis ?? true}
                  onCheckedChange={(checked) => updateProperty('showYAxis', checked)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Title</Label>
                <Input
                  value={widget.properties?.yAxisLabel || ''}
                  onChange={(e) => updateProperty('yAxisLabel', e.target.value)}
                  placeholder="Enter Y-axis title"
                  className="h-7 text-xs"
                />
              </div>
              {(widget.properties?.showYAxis ?? true) && (
                <>
                  <Separator />
                  <div className="space-y-3 pt-1">
                    {/* Axis Scale - Min/Max */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Min value</Label>
                        <Input
                          type="number"
                          value={widget.properties?.yAxisMin || ''}
                          onChange={(e) => updateProperty('yAxisMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Auto"
                          className="h-7 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Max value</Label>
                        <Input
                          type="number"
                          value={widget.properties?.yAxisMax || ''}
                          onChange={(e) => updateProperty('yAxisMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                          placeholder="Auto"
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Title Font Size</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={widget.properties?.yAxisTitleFontSize || 12}
                          onChange={(e) => updateProperty('yAxisTitleFontSize', parseInt(e.target.value) || 12)}
                          className="h-7 text-xs pr-8"
                          min="8"
                          max="24"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Title Color</Label>
                        <ColorInput
                          value={widget.properties?.yAxisTitleColor || '#111827'}
                          onChange={(color) => updateProperty('yAxisTitleColor', color)}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#111827"
                          inputClassName="h-7 text-xs pl-7 w-full"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Tick Color</Label>
                        <ColorInput
                          value={widget.properties?.yAxisTickColor || '#111827'}
                          onChange={(color) => updateProperty('yAxisTickColor', color)}
                          allowImageVideo={false}
                          className="relative"
                          placeholder="#111827"
                          inputClassName="h-7 text-xs pl-7 w-full"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Tick Font Size</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={widget.properties?.yAxisTickFontSize || 12}
                            onChange={(e) => updateProperty('yAxisTickFontSize', parseInt(e.target.value) || 12)}
                            className="h-7 text-xs pr-8"
                            min="8"
                            max="20"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Font Family</Label>
                        <Select
                          value={widget.properties?.yAxisFontFamily || 'Roboto'}
                          onValueChange={(value) => updateProperty('yAxisFontFamily', value)}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Number format - Looker Studio style */}
      <AccordionItem value="numberFormat" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Number format</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Format type</Label>
              <Select
                value={widget.properties?.numberFormatType || 'auto'}
                onValueChange={(value) => updateProperty('numberFormatType', value)}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="scientific">Scientific</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(widget.properties?.numberFormatType === 'number' || widget.properties?.numberFormatType === 'currency') && (
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Decimal places</Label>
                  <Input
                    type="number"
                    value={widget.properties?.decimalPlaces ?? 2}
                    onChange={(e) => updateProperty('decimalPlaces', parseInt(e.target.value) || 0)}
                    className="h-7 text-xs"
                    min="0"
                    max="10"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Thousands separator</Label>
                    <p className="text-xs text-muted-foreground">Use comma for thousands</p>
                  </div>
                  <Switch
                    checked={widget.properties?.thousandsSeparator ?? true}
                    onCheckedChange={(checked) => updateProperty('thousandsSeparator', checked)}
                  />
                </div>
              </>
            )}
            {widget.properties?.numberFormatType === 'currency' && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Currency symbol</Label>
                <Input
                  value={widget.properties?.currencySymbol || '$'}
                  onChange={(e) => updateProperty('currencySymbol', e.target.value)}
                  placeholder="$"
                  className="h-7 text-xs"
                  maxLength={3}
                />
              </div>
            )}
            {widget.properties?.numberFormatType === 'percentage' && (
              <div className="space-y-1">
                <Label className="text-xs font-medium">Decimal places</Label>
                <Input
                  type="number"
                  value={widget.properties?.decimalPlaces ?? 1}
                  onChange={(e) => updateProperty('decimalPlaces', parseInt(e.target.value) || 0)}
                  className="h-7 text-xs"
                  min="0"
                  max="10"
                />
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Tooltip - Looker Studio style */}
      <AccordionItem value="tooltip" className="border-0">
        <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
          <div className="flex items-center gap-2 flex-1">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Tooltip</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-3">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Font Size</Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={widget.properties?.tooltipFontSize || 12}
                    onChange={(e) => updateProperty('tooltipFontSize', parseInt(e.target.value) || 12)}
                    className="h-7 text-xs pr-8"
                    min="8"
                    max="20"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">px</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Font Family</Label>
                <Select
                  value={widget.properties?.tooltipFontFamily || 'Roboto'}
                  onValueChange={(value) => updateProperty('tooltipFontFamily', value)}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Pie/Donut chart - Looker Studio style */}
      {isPieDonut && (
        <AccordionItem value="pieSettings" className="border-0">
          <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
            <div className="flex items-center gap-2 flex-1">
              <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Pie/Donut chart</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-3">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Outer Radius</Label>
                <Input
                  type="number"
                  value={widget.properties?.pieOuterRadius || 80}
                  onChange={(e) => updateProperty('pieOuterRadius', parseInt(e.target.value) || 80)}
                  className="h-7 text-xs"
                  min="20"
                  max="150"
                />
              </div>
              {chartType === 'donut' && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Inner Radius</Label>
                    <Input
                      type="number"
                      value={widget.properties?.innerRadius || 40}
                      onChange={(e) => updateProperty('innerRadius', parseInt(e.target.value) || 40)}
                      className="h-7 text-xs"
                      min="0"
                      max="90"
                    />
                  </div>
                </>
              )}
              {(widget.properties?.showLabels ?? true) && (
                <div className="flex items-center justify-between pt-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Show Label Lines</Label>
                    <p className="text-xs text-muted-foreground">Display lines to labels</p>
                  </div>
                  <Switch
                    checked={widget.properties?.showLabelLines ?? false}
                    onCheckedChange={(checked) => updateProperty('showLabelLines', checked)}
                  />
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </>
  )
}

