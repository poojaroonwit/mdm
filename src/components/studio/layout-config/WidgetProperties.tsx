'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash, Palette, Database, Settings, Square, Box, Layers, BarChart3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { widgetsPalette, PlacedWidget } from './widgets'
import { ComponentStyle } from './types'
import { getWidgetComponentType } from './globalStyleUtils'
import { getThemeComponentStyleSync } from './themeStyleUtils'
import type { BrandingConfig } from '@/types/branding'
import { PositionSection } from './PositionSection'
import { LayoutSection } from './LayoutSection'
import { AppearanceSection } from './AppearanceSection'
import { FillSection } from './FillSection'
import { StrokeSection } from './StrokeSection'
import { EffectsSection } from './EffectsSection'
import { DataSourceSection } from './DataSourceSection'
import { WidgetSpecificSection } from './WidgetSpecificSection'
import { OtherPropertiesSection } from './OtherPropertiesSection'
import { HeaderSection } from './HeaderSection'
import { TextSection } from './TextSection'
import { SpacingSection } from './SpacingSection'

interface WidgetPropertiesProps {
  widget: PlacedWidget
  selectedWidgetId: string
  setPlacedWidgets: React.Dispatch<React.SetStateAction<PlacedWidget[]>>
  setSelectedWidgetId: React.Dispatch<React.SetStateAction<string | null>>
  spaceId?: string
}

export function WidgetProperties({
  widget,
  selectedWidgetId,
  setPlacedWidgets,
  setSelectedWidgetId,
  spaceId,
}: WidgetPropertiesProps) {
  const widgetDef = widgetsPalette.find(wd => wd.type === widget.type)
  const [themeConfig, setThemeConfig] = useState<BrandingConfig | undefined>(undefined)
  const [componentStyle, setComponentStyle] = useState<ComponentStyle | undefined>(undefined)
  
  // Fetch active theme config
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/admin/branding')
        if (response.ok) {
          const data = await response.json()
          if (data.branding) {
            const brandingConfig = data.branding as BrandingConfig
            setThemeConfig(brandingConfig)
            
            // Get component style for this widget
            const componentType = getWidgetComponentType(widget.type)
            if (componentType) {
              const style = getThemeComponentStyleSync(brandingConfig, componentType)
              setComponentStyle(style)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching theme:', error)
      }
    }
    
    fetchTheme()
  }, [widget.type])
  
  if (!widgetDef) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Widget not found
      </div>
    )
  }

  // Determine if widget needs data source (charts, tables, etc.)
  const needsDataSource = widget.type.includes('chart') || 
                          widget.type.includes('table') || 
                          widget.type === 'scorecard' ||
                          widget.type === 'time-series' ||
                          widget.type === 'pivot-table'

  return (
    <div className="space-y-3">
      <div className="px-4 pt-6 border-b pb-6">
        <div className="flex items-center gap-2 mb-2">
          {widgetDef.icon && <widgetDef.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          <Input
            value={widget.properties?.name || widgetDef.label}
            onChange={(e) => {
              setPlacedWidgets(prev => prev.map(w => 
                w.id === selectedWidgetId 
                  ? { ...w, properties: { ...w.properties, name: e.target.value } }
                  : w
              ))
            }}
            className="h-8 text-base font-semibold px-2 border-0 bg-transparent hover:bg-muted/50 focus:bg-muted/50 focus-visible:ring-0"
            placeholder={widgetDef.label}
          />
        </div>
      </div>

      <div className="w-full mb-4">
      <Tabs defaultValue={needsDataSource ? "datasource" : "properties"}>
        <TabsList className={`flex h-8 border-0 bg-transparent gap-1 mx-4`}>
          {needsDataSource && (
            <TabsTrigger value="datasource" className="flex-1 text-xs px-3 data-[state=active]:bg-transparent data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:underline">
              <Database className="h-3.5 w-3.5 mr-1.5" />
              Data Source
            </TabsTrigger>
          )}
          <TabsTrigger value="properties" className={`${needsDataSource ? 'flex-1' : 'w-full'} text-xs px-3 data-[state=active]:bg-transparent data-[state=active]:border-0 data-[state=active]:border-b-2 data-[state=active]:border-b-primary data-[state=active]:underline`}>
            <Palette className="h-3.5 w-3.5 mr-1.5" />
            Properties
          </TabsTrigger>
        </TabsList>

        {needsDataSource && (
          <TabsContent value="datasource" className="mt-0 overflow-visible">
            <div className="w-full overflow-visible">
              <Accordion type="single" collapsible defaultValue={'datasource'}>
                <DataSourceSection
                widget={widget}
                selectedWidgetId={selectedWidgetId}
                setPlacedWidgets={setPlacedWidgets}
                spaceId={spaceId}
              />
              </Accordion>
            </div>
          </TabsContent>
        )}

        <TabsContent value="properties" className="mt-0">
          <div className="w-full">
            <Accordion 
              type="single" 
              collapsible 
              defaultValue={widget.type.includes('chart') ? 'chart-style' : (widget.type === 'text' ? 'text' : 'layout')}
            >
             {/* Text-specific section (replaces Header) */}
             {widget.type === 'text' && (
               <AccordionItem value="text" className="border-0 border-t border-b-0">
                <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                  <div className="flex items-center gap-2 flex-1">
                    <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Text</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pt-2">
                  <TextSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
            {/* Chart Style - Only for charts (Chart type, Series, etc.) */}
            {widget.type.includes('chart') && (
              <WidgetSpecificSection
                widget={widget}
                selectedWidgetId={selectedWidgetId}
                setPlacedWidgets={setPlacedWidgets}
              />
            )}

            

             {/* Layout - standalone group */}
             <AccordionItem value="layout" className="border-0 border-t border-b-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Layout</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <LayoutSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

             {/* Background */}
             <AccordionItem value="background" className="border-0 border-t border-b-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Background</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <FillSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    themeStyle={componentStyle}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

             {/* Appearance */}
             <AccordionItem value="appearance" className="border-0 border-t border-b-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Square className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Appearance</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <AppearanceSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    themeStyle={componentStyle}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

             {/* Spacing */}
             <AccordionItem value="spacing" className="border-0 border-t border-b-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Spacing</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <SpacingSection
                  widget={widget}
                  selectedWidgetId={selectedWidgetId}
                  setPlacedWidgets={setPlacedWidgets}
                />
              </AccordionContent>
            </AccordionItem>

             {/* Border - Looker Studio style */}
             <AccordionItem value="border" className="border-0 border-t border-b-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Box className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Border</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <StrokeSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    themeStyle={componentStyle}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

             {/* Shadow */}
             <AccordionItem value="effects" className="border-0 border-t border-b-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Shadow</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <EffectsSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                    themeStyle={componentStyle}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Other Widget Settings - For non-chart widgets */}
            {!widget.type.includes('chart') && (
              <WidgetSpecificSection
                widget={widget}
                selectedWidgetId={selectedWidgetId}
                setPlacedWidgets={setPlacedWidgets}
              />
            )}

             {/* Position - moved to bottom, just above Other */}
             <AccordionItem value="position" className="border-0 border-t border-b-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Position</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <PositionSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

             {/* Other Properties - Moved to bottom */}
             <AccordionItem value="other" className="border-0 border-t border-b-0">
              <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
                <div className="flex items-center gap-2 flex-1">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Other</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-0 pt-2">
                <div className="space-y-0">
                  <OtherPropertiesSection
                    widget={widget}
                    selectedWidgetId={selectedWidgetId}
                    setPlacedWidgets={setPlacedWidgets}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {/* Delete Widget */}
      <div className="px-4 pt-2 border-t">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={() => {
            setPlacedWidgets(prev => prev.filter(w => w.id !== selectedWidgetId))
            setSelectedWidgetId(null)
          }}
        >
          <Trash className="h-3.5 w-3.5 mr-1" />
          Delete Widget
        </Button>
      </div>
    </div>
  )
}
