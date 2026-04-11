'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Monitor,
  Tablet,
  Smartphone,
  Grid3X3,
  Columns,
  Rows,
  Square,
  Maximize,
  Minimize,
  Settings,
  Eye,
  Edit,
  Trash2,
  Plus,
  Copy,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Space,
  CornerUpLeft,
  CornerUpRight,
  CornerDownLeft,
  CornerDownRight
} from 'lucide-react'

interface Breakpoint {
  id: string
  name: string
  width: number
  height: number
  minWidth?: number
  maxWidth?: number
  icon: string
  color: string
}

interface LayoutConfig {
  id: string
  name: string
  type: 'grid' | 'flexbox' | 'absolute' | 'flow'
  columns?: number
  rows?: number
  gap?: number
  padding?: number
  margin?: number
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'
  alignItems?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  breakpoints: Record<string, Partial<LayoutConfig>>
}

interface ResponsiveLayoutManagerProps {
  layouts: LayoutConfig[]
  currentBreakpoint: string
  onUpdateLayout: (id: string, updates: Partial<LayoutConfig>) => void
  onCreateLayout: (layout: Omit<LayoutConfig, 'id'>) => void
  onDeleteLayout: (id: string) => void
  onSelectBreakpoint: (breakpoint: string) => void
}

const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  {
    id: 'desktop',
    name: 'Desktop',
    width: 1200,
    height: 800,
    minWidth: 1024,
    icon: 'Monitor',
    color: '#1e40af'
  },
  {
    id: 'tablet',
    name: 'Tablet',
    width: 768,
    height: 1024,
    minWidth: 768,
    maxWidth: 1023,
    icon: 'Tablet',
    color: '#10b981'
  },
  {
    id: 'mobile',
    name: 'Mobile',
    width: 375,
    height: 667,
    maxWidth: 767,
    icon: 'Smartphone',
    color: '#f59e0b'
  }
]

export function ResponsiveLayoutManager({
  layouts,
  currentBreakpoint,
  onUpdateLayout,
  onCreateLayout,
  onDeleteLayout,
  onSelectBreakpoint
}: ResponsiveLayoutManagerProps) {
  const [selectedLayout, setSelectedLayout] = useState<LayoutConfig | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const currentBreakpointConfig = DEFAULT_BREAKPOINTS.find(bp => bp.id === currentBreakpoint)

  const handleCreateLayout = useCallback(() => {
    const newLayout: Omit<LayoutConfig, 'id'> = {
      name: 'New Layout',
      type: 'grid',
      columns: 12,
      rows: 8,
      gap: 16,
      padding: 16,
      margin: 0,
      justifyContent: 'start',
      alignItems: 'start',
      breakpoints: {}
    }
    onCreateLayout(newLayout)
  }, [onCreateLayout])

  const handleUpdateLayoutProperty = useCallback((property: string, value: any) => {
    if (!selectedLayout) return
    
    const updates: Partial<LayoutConfig> = {}
    
    if (property.startsWith('breakpoint.')) {
      const breakpointId = property.split('.')[1]
      updates.breakpoints = {
        ...selectedLayout.breakpoints,
        [breakpointId]: {
          ...selectedLayout.breakpoints[breakpointId],
          [property.split('.').slice(2).join('.')]: value
        }
      }
    } else {
      updates[property as keyof LayoutConfig] = value
    }
    
    onUpdateLayout(selectedLayout.id, updates)
  }, [selectedLayout, onUpdateLayout])

  const getCurrentLayoutConfig = useCallback(() => {
    if (!selectedLayout) return null
    
    const breakpointConfig = selectedLayout.breakpoints[currentBreakpoint]
    return {
      ...selectedLayout,
      ...breakpointConfig
    }
  }, [selectedLayout, currentBreakpoint])

  const currentConfig = getCurrentLayoutConfig()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Grid3X3 className="h-6 w-6" />
            Responsive Layout Manager
          </h2>
          <p className="text-muted-foreground">
            Design layouts for different screen sizes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode ? 'default' : 'outline'}
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleCreateLayout}>
            <Plus className="h-4 w-4 mr-2" />
            New Layout
          </Button>
        </div>
      </div>

      {/* Breakpoint Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Breakpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {DEFAULT_BREAKPOINTS.map(breakpoint => (
              <Button
                key={breakpoint.id}
                variant={currentBreakpoint === breakpoint.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onSelectBreakpoint(breakpoint.id)}
                className="flex items-center gap-2"
                style={{ 
                  backgroundColor: currentBreakpoint === breakpoint.id ? breakpoint.color : undefined,
                  borderColor: breakpoint.color
                }}
              >
                {breakpoint.icon === 'Monitor' && <Monitor className="h-4 w-4" />}
                {breakpoint.icon === 'Tablet' && <Tablet className="h-4 w-4" />}
                {breakpoint.icon === 'Smartphone' && <Smartphone className="h-4 w-4" />}
                {breakpoint.name}
                <Badge variant="outline" className="ml-1">
                  {breakpoint.width}×{breakpoint.height}
                </Badge>
              </Button>
            ))}
          </div>
          
          {currentBreakpointConfig && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Current:</span>
                <span>{currentBreakpointConfig.name}</span>
                <Badge variant="outline">
                  {currentBreakpointConfig.width}×{currentBreakpointConfig.height}
                </Badge>
                {currentBreakpointConfig.minWidth && (
                  <Badge variant="outline">
                    Min: {currentBreakpointConfig.minWidth}px
                  </Badge>
                )}
                {currentBreakpointConfig.maxWidth && (
                  <Badge variant="outline">
                    Max: {currentBreakpointConfig.maxWidth}px
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Layout List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {layouts.map(layout => (
          <Card 
            key={layout.id} 
            className={`cursor-pointer transition-all ${
              selectedLayout?.id === layout.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedLayout(layout)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{layout.name}</CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsEditing(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteLayout(layout.id)
                    }}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{layout.type}</Badge>
                  {layout.columns && (
                    <Badge variant="outline">
                      {layout.columns} cols
                    </Badge>
                  )}
                  {layout.rows && (
                    <Badge variant="outline">
                      {layout.rows} rows
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Gap: {layout.gap}px | Padding: {layout.padding}px
                </div>
                <div className="text-sm text-muted-foreground">
                  Breakpoints: {Object.keys(layout.breakpoints).length}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Layout Editor */}
      {selectedLayout && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Edit Layout: {selectedLayout.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Done' : 'Edit'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing && (
              <div className="space-y-6">
                {/* Basic Properties */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Layout Name</Label>
                    <Input
                      value={selectedLayout.name}
                      onChange={(e) => onUpdateLayout(selectedLayout.id, { name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Layout Type</Label>
                    <Select
                      value={selectedLayout.type}
                      onValueChange={(value: any) => onUpdateLayout(selectedLayout.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">CSS Grid</SelectItem>
                        <SelectItem value="flexbox">Flexbox</SelectItem>
                        <SelectItem value="absolute">Absolute Positioning</SelectItem>
                        <SelectItem value="flow">Normal Flow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Grid Properties */}
                {selectedLayout.type === 'grid' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Grid Properties</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Columns</Label>
                        <Input
                          type="number"
                          value={currentConfig?.columns || 12}
                          onChange={(e) => handleUpdateLayoutProperty('columns', parseInt(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label>Rows</Label>
                        <Input
                          type="number"
                          value={currentConfig?.rows || 8}
                          onChange={(e) => handleUpdateLayoutProperty('rows', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Flexbox Properties */}
                {selectedLayout.type === 'flexbox' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Flexbox Properties</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Justify Content</Label>
                        <Select
                          value={currentConfig?.justifyContent || 'start'}
                          onValueChange={(value: any) => handleUpdateLayoutProperty('justifyContent', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="start">Start</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="end">End</SelectItem>
                            <SelectItem value="between">Space Between</SelectItem>
                            <SelectItem value="around">Space Around</SelectItem>
                            <SelectItem value="evenly">Space Evenly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Align Items</Label>
                        <Select
                          value={currentConfig?.alignItems || 'start'}
                          onValueChange={(value: any) => handleUpdateLayoutProperty('alignItems', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="start">Start</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="end">End</SelectItem>
                            <SelectItem value="stretch">Stretch</SelectItem>
                            <SelectItem value="baseline">Baseline</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Flex Direction</Label>
                        <Select
                          value={currentConfig?.flexDirection || 'row'}
                          onValueChange={(value: any) => handleUpdateLayoutProperty('flexDirection', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="row">Row</SelectItem>
                            <SelectItem value="column">Column</SelectItem>
                            <SelectItem value="row-reverse">Row Reverse</SelectItem>
                            <SelectItem value="column-reverse">Column Reverse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Flex Wrap</Label>
                        <Select
                          value={currentConfig?.flexWrap || 'nowrap'}
                          onValueChange={(value: any) => handleUpdateLayoutProperty('flexWrap', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nowrap">No Wrap</SelectItem>
                            <SelectItem value="wrap">Wrap</SelectItem>
                            <SelectItem value="wrap-reverse">Wrap Reverse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Spacing Properties */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Spacing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Gap: {currentConfig?.gap || 16}px</Label>
                      <Slider
                        value={[currentConfig?.gap || 16]}
                        onValueChange={(value) => handleUpdateLayoutProperty('gap', value[0])}
                        min={0}
                        max={100}
                        step={4}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Padding: {currentConfig?.padding || 16}px</Label>
                      <Slider
                        value={[currentConfig?.padding || 16]}
                        onValueChange={(value) => handleUpdateLayoutProperty('padding', value[0])}
                        min={0}
                        max={100}
                        step={4}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                {/* Breakpoint-specific Properties */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Breakpoint-specific Properties</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">
                      Properties for {currentBreakpointConfig?.name} ({currentBreakpointConfig?.width}×{currentBreakpointConfig?.height})
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Columns Override</Label>
                        <Input
                          type="number"
                          value={currentConfig?.breakpoints?.[currentBreakpoint]?.columns || ''}
                          onChange={(e) => handleUpdateLayoutProperty(`breakpoint.${currentBreakpoint}.columns`, parseInt(e.target.value) || undefined)}
                          placeholder="Inherit"
                        />
                      </div>
                      <div>
                        <Label>Gap Override</Label>
                        <Input
                          type="number"
                          value={currentConfig?.breakpoints?.[currentBreakpoint]?.gap || ''}
                          onChange={(e) => handleUpdateLayoutProperty(`breakpoint.${currentBreakpoint}.gap`, parseInt(e.target.value) || undefined)}
                          placeholder="Inherit"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Layout Preview */}
            {previewMode && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Layout Preview</h3>
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 bg-white"
                  style={{
                    width: currentBreakpointConfig?.width || 800,
                    height: currentBreakpointConfig?.height || 600,
                    display: currentConfig?.type === 'grid' ? 'grid' : 'flex',
                    gridTemplateColumns: currentConfig?.type === 'grid' ? `repeat(${currentConfig?.columns || 12}, 1fr)` : undefined,
                    gridTemplateRows: currentConfig?.type === 'grid' ? `repeat(${currentConfig?.rows || 8}, 1fr)` : undefined,
                    gap: `${currentConfig?.gap || 16}px`,
                    padding: `${currentConfig?.padding || 16}px`,
                    justifyContent: currentConfig?.justifyContent || 'start',
                    alignItems: currentConfig?.alignItems || 'start',
                    flexDirection: currentConfig?.flexDirection || 'row',
                    flexWrap: currentConfig?.flexWrap || 'nowrap'
                  }}
                >
                  {/* Mock grid items */}
                  {Array.from({ length: (currentConfig?.columns || 12) * (currentConfig?.rows || 8) }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-primary/10 border border-primary/20 rounded text-xs flex items-center justify-center"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
