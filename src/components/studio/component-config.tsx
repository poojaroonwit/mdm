'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ColorInput } from './layout-config/ColorInput'
import { MultiSideInput } from '@/components/shared/MultiSideInput'
import { 
  Database, 
  Palette, 
  Settings, 
  Filter,
  BarChart3,
  Table,
  Image,
  Calendar,
  Map,
  User,
  FileText,
  Search,
  Bell,
  Building,
  Package,
  ShoppingCart,
  Play,
  Activity,
  TrendingUp,
  PieChart,
  FileSpreadsheet
} from 'lucide-react'
import { RecordConfig } from './record-config'
import { ComponentDataSourceConfig } from './ComponentDataSourceConfig'

interface PageComponent {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  config: any
  style: any
}

interface ComponentConfigProps {
  component: PageComponent
  onUpdate: (component: PageComponent) => void
}

const componentIcons: Record<string, any> = {
  chart: BarChart3,
  table: Table,
  metric: BarChart3,
  grid: Table,
  form: FileText,
  filter: Filter,
  search: Search,
  card: FileText,
  accordion: FileText,
  tabs: FileText,
  image: Image,
  video: Play,
  text: FileText,
  map: Map,
  location: Map,
  calendar: Calendar,
  timeline: Activity,
  profile: User,
  comments: FileText,
  notifications: Bell,
  company: Building,
  product: Package,
  order: ShoppingCart
}

export function ComponentConfig({ component, onUpdate }: ComponentConfigProps) {
  const [config, setConfig] = useState(component.config || {})
  const [style, setStyle] = useState(component.style || {})
  const [customCSS, setCustomCSS] = useState('')

  const IconComponent = componentIcons[component.type] || Settings

  const handleConfigUpdate = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onUpdate({ ...component, config: newConfig })
  }

  const handleStyleUpdate = (key: string, value: any) => {
    const newStyle = { ...style, [key]: value }
    setStyle(newStyle)
    onUpdate({ ...component, style: newStyle })
  }

  const handleCustomCSSUpdate = (css: string) => {
    setCustomCSS(css)
    // Apply custom CSS to component
    const newStyle = { ...style, customCSS: css }
    setStyle(newStyle)
    onUpdate({ ...component, style: newStyle })
  }

  const renderGeneralConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="component-title">Title</Label>
          <Input
            id="component-title"
            value={config.title || ''}
            onChange={(e) => handleConfigUpdate('title', e.target.value)}
            placeholder="Component title"
          />
        </div>

        <div>
          <Label htmlFor="component-description">Description</Label>
          <Textarea
            id="component-description"
            value={config.description || ''}
            onChange={(e) => handleConfigUpdate('description', e.target.value)}
            placeholder="Component description"
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="component-width">Width (px)</Label>
          <Input
            id="component-width"
            type="number"
            value={component.width}
            onChange={(e) => onUpdate({ ...component, width: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Label htmlFor="component-height">Height (px)</Label>
          <Input
            id="component-height"
            type="number"
            value={component.height}
            onChange={(e) => onUpdate({ ...component, height: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="component-visible"
            checked={config.visible !== false}
            onCheckedChange={(checked) => handleConfigUpdate('visible', checked)}
          />
          <Label htmlFor="component-visible">Visible</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="component-loading"
            checked={config.showLoading || false}
            onCheckedChange={(checked) => handleConfigUpdate('showLoading', checked)}
          />
          <Label htmlFor="component-loading">Show Loading State</Label>
        </div>

        {/* Component-specific configurations */}
        {component.type === 'chart' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="chart-type">Chart Type</Label>
              <Select 
                value={config.chartType || 'line'} 
                onValueChange={(value) => handleConfigUpdate('chartType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="x-axis">X-Axis Field</Label>
              <Input
                id="x-axis"
                value={config.xAxis || ''}
                onChange={(e) => handleConfigUpdate('xAxis', e.target.value)}
                placeholder="Field name for X-axis"
              />
            </div>
            <div>
              <Label htmlFor="y-axis">Y-Axis Field</Label>
              <Input
                id="y-axis"
                value={config.yAxis || ''}
                onChange={(e) => handleConfigUpdate('yAxis', e.target.value)}
                placeholder="Field name for Y-axis"
              />
            </div>
          </div>
        )}

        {component.type === 'table' && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="page-size">Page Size</Label>
              <Input
                id="page-size"
                type="number"
                value={config.pageSize || 10}
                onChange={(e) => handleConfigUpdate('pageSize', parseInt(e.target.value) || 10)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="table-sortable"
                checked={config.sortable !== false}
                onCheckedChange={(checked) => handleConfigUpdate('sortable', checked)}
              />
              <Label htmlFor="table-sortable">Sortable Columns</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="table-filterable"
                checked={config.filterable || false}
                onCheckedChange={(checked) => handleConfigUpdate('filterable', checked)}
              />
              <Label htmlFor="table-filterable">Filterable</Label>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderStyleConfig = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="background-color">Background Color</Label>
          <ColorInput
            value={style.backgroundColor || '#ffffff'}
            onChange={(color) => handleStyleUpdate('backgroundColor', color)}
            allowImageVideo={false}
            className="relative"
            placeholder="#ffffff"
            inputClassName="h-8 text-xs pl-7"
          />
        </div>

        <div>
          <Label htmlFor="text-color">Text Color</Label>
          <ColorInput
            value={style.color || '#000000'}
            onChange={(color) => handleStyleUpdate('color', color)}
            allowImageVideo={false}
            className="relative"
            placeholder="#000000"
            inputClassName="h-8 text-xs pl-7"
          />
        </div>

        <div>
          <Label htmlFor="border-color">Border Color</Label>
          <ColorInput
            value={style.borderColor || '#e5e7eb'}
            onChange={(color) => handleStyleUpdate('borderColor', color)}
            allowImageVideo={false}
            className="relative"
            placeholder="#e5e7eb"
            inputClassName="h-8 text-xs pl-7"
          />
        </div>

        <MultiSideInput
          label="Border Width"
          baseKey="borderWidth"
          type="sides"
          defaultValue="1px"
          inputClassName="h-8 text-xs"
          getValue={(side: string) => {
            const key = `borderWidth${side.charAt(0).toUpperCase() + side.slice(1)}`
            const baseValue = style.borderWidth || '1px'
            const sideValue = style[key]
            return sideValue || baseValue
          }}
          setValue={(updates) => {
            const newStyle = { ...style }
            Object.keys(updates).forEach(key => {
              newStyle[key] = updates[key]
            })
            setStyle(newStyle)
            onUpdate({ ...component, style: newStyle })
          }}
        />

        <MultiSideInput
          label="Border Radius"
          baseKey="borderRadius"
          type="corners"
          defaultValue="0px"
          inputClassName="h-8 text-xs"
          getValue={(side: string) => {
            const br = style.borderRadius
            if (typeof br === 'string') {
              // If it's a string like "8px", check if there's an object version
              const objKey = `borderRadius${side.charAt(0).toUpperCase() + side.slice(1)}`
              return style[objKey] || br
            }
            if (typeof br === 'object' && br !== null) {
              const obj = br as any
              const corner = obj[side]
              return corner?.value ? `${corner.value}${corner.unit || 'px'}` : '0px'
            }
            return '0px'
          }}
          setValue={(updates) => {
            const newStyle = { ...style }
            let brObj: any = {}
            
            // Initialize from existing borderRadius
            if (typeof style.borderRadius === 'string') {
              const baseValue = parseInt(style.borderRadius) || 0
              brObj = {
                topLeft: { value: baseValue, unit: 'px' },
                topRight: { value: baseValue, unit: 'px' },
                bottomRight: { value: baseValue, unit: 'px' },
                bottomLeft: { value: baseValue, unit: 'px' }
              }
            } else if (typeof style.borderRadius === 'object' && style.borderRadius !== null) {
              brObj = { ...style.borderRadius }
            } else {
              brObj = {
                topLeft: { value: 0, unit: 'px' },
                topRight: { value: 0, unit: 'px' },
                bottomRight: { value: 0, unit: 'px' },
                bottomLeft: { value: 0, unit: 'px' }
              }
            }
            
            // Update from updates
            Object.keys(updates).forEach(key => {
              if (key === 'borderRadius') {
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
              } else if (key.startsWith('borderRadius')) {
                const corner = key.replace('borderRadius', '').charAt(0).toLowerCase() + key.replace('borderRadius', '').slice(1)
                const value = updates[key]
                if (typeof value === 'string' && value.endsWith('px')) {
                  const numValue = parseInt(value.replace('px', '')) || 0
                  brObj[corner] = { value: numValue, unit: 'px' }
                }
              } else {
                newStyle[key] = updates[key]
              }
            })
            
            // Check if all corners are the same
            const allSame = brObj.topLeft.value === brObj.topRight.value &&
                           brObj.topRight.value === brObj.bottomRight.value &&
                           brObj.bottomRight.value === brObj.bottomLeft.value &&
                           brObj.topLeft.unit === brObj.topRight.unit &&
                           brObj.topRight.unit === brObj.bottomRight.unit &&
                           brObj.bottomRight.unit === brObj.bottomLeft.unit
            
            newStyle.borderRadius = allSame ? `${brObj.topLeft.value}px` : brObj
            setStyle(newStyle)
            onUpdate({ ...component, style: newStyle })
          }}
        />

        <MultiSideInput
          label="Padding"
          baseKey="padding"
          type="sides"
          defaultValue="16px"
          inputClassName="h-8 text-xs"
          getValue={(side: string) => {
            const key = `padding${side.charAt(0).toUpperCase() + side.slice(1)}`
            const baseValue = style.padding || '16px'
            const sideValue = style[key]
            return sideValue || baseValue
          }}
          setValue={(updates) => {
            const newStyle = { ...style }
            Object.keys(updates).forEach(key => {
              newStyle[key] = updates[key]
            })
            setStyle(newStyle)
            onUpdate({ ...component, style: newStyle })
          }}
        />

        <div>
          <Label htmlFor="font-size">Font Size (px)</Label>
          <Input
            id="font-size"
            type="number"
            value={parseInt(style.fontSize) || 14}
            onChange={(e) => handleStyleUpdate('fontSize', `${e.target.value}px`)}
          />
        </div>

        <div>
          <Label htmlFor="font-weight">Font Weight</Label>
          <Select 
            value={style.fontWeight || 'normal'} 
            onValueChange={(value) => handleStyleUpdate('fontWeight', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="lighter">Lighter</SelectItem>
              <SelectItem value="bolder">Bolder</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="custom-css">Custom CSS</Label>
          <Textarea
            id="custom-css"
            value={customCSS}
            onChange={(e) => handleCustomCSSUpdate(e.target.value)}
            placeholder="/* Custom CSS styles */"
            rows={6}
            className="font-mono text-sm"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <IconComponent className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Component Configuration</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure data source, appearance, and behavior
        </p>
      </div>

      <div className="w-full">
      <Tabs defaultValue="data">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Records
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Style
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Data Source Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ComponentDataSourceConfig config={config} handleConfigUpdate={handleConfigUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <RecordConfig
            component={component}
            onUpdate={(config: any) => onUpdate({ ...component, config })}
          />
        </TabsContent>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">General Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {renderGeneralConfig()}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="style" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Style Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {renderStyleConfig()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
