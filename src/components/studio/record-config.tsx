'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Database, 
  Eye, 
  Settings, 
  Layout, 
  Palette, 
  Type, 
  Grid, 
  List, 
  Table,
  User,
  Calendar,
  FileText,
  Image,
  Link,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Hash,
  ToggleLeft,
  Star,
  Heart,
  MessageSquare,
  Bell,
  Tag,
  Filter,
  Search,
  Plus,
  Trash2,
  Edit,
  Copy,
  Move,
  GripVertical
} from 'lucide-react'
import { DataSourceSelector } from './data-source-selector'
import { RecordPreview } from './record-preview'

interface RecordField {
  id: string
  name: string
  displayName: string
  type: string
  required: boolean
  visible: boolean
  editable: boolean
  width?: number
  order: number
  format?: string
  validation?: any
}

interface RecordConfig {
  id: string
  name: string
  description: string
  dataSource: string
  fields: RecordField[]
  layout: {
    mode: 'table' | 'list' | 'grid' | 'card'
    columns: number
    density: 'compact' | 'normal' | 'spacious'
    showHeaders: boolean
    showBorders: boolean
    alternatingRows: boolean
  }
  display: {
    showPagination: boolean
    pageSize: number
    showSearch: boolean
    showFilters: boolean
    showSorting: boolean
    showActions: boolean
  }
  styling: {
    theme: 'default' | 'minimal' | 'modern' | 'classic'
    primaryColor: string
    backgroundColor: string
    textColor: string
    borderColor: string
    borderRadius: number
    fontSize: 'small' | 'medium' | 'large'
    fontFamily: string
  }
  actions: {
    allowCreate: boolean
    allowEdit: boolean
    allowDelete: boolean
    allowExport: boolean
    allowImport: boolean
    allowBulkActions: boolean
  }
}

interface RecordConfigProps {
  component: any
  onUpdate: (config: RecordConfig) => void
}

const fieldTypeIcons: Record<string, any> = {
  TEXT: Type,
  NUMBER: Hash,
  EMAIL: Mail,
  PHONE: Phone,
  URL: Link,
  DATE: Calendar,
  DATETIME: Calendar,
  BOOLEAN: ToggleLeft,
  SELECT: List,
  MULTISELECT: List,
  TEXTAREA: FileText,
  RICH_TEXT: FileText,
  IMAGE: Image,
  FILE: FileText,
  LOCATION: MapPin,
  CURRENCY: DollarSign,
  PERCENTAGE: Hash,
  RATING: Star,
  COLOR: Palette,
  JSON: FileText
}

const defaultRecordConfig: RecordConfig = {
  id: '',
  name: 'Record Configuration',
  description: 'Configure how records are displayed',
  dataSource: '',
  fields: [],
  layout: {
    mode: 'table',
    columns: 2,
    density: 'normal',
    showHeaders: true,
    showBorders: true,
    alternatingRows: true
  },
  display: {
    showPagination: true,
    pageSize: 20,
    showSearch: true,
    showFilters: true,
    showSorting: true,
    showActions: true
  },
  styling: {
    theme: 'default',
    primaryColor: '#1e40af',
    backgroundColor: '#ffffff',
    textColor: '#374151',
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 'medium',
    fontFamily: 'Inter'
  },
  actions: {
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    allowExport: true,
    allowImport: false,
    allowBulkActions: true
  }
}

export function RecordConfig({ component, onUpdate }: RecordConfigProps) {
  const [config, setConfig] = useState<RecordConfig>(defaultRecordConfig)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedDataSource, setSelectedDataSource] = useState<any>(null)

  useEffect(() => {
    if (component?.config?.recordConfig) {
      setConfig(component.config.recordConfig)
    }
  }, [component])

  const handleConfigUpdate = (updates: Partial<RecordConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onUpdate({ ...component, config: { ...component.config, recordConfig: newConfig } })
  }

  const handleFieldUpdate = (fieldId: string, updates: Partial<RecordField>) => {
    const updatedFields = config.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    )
    handleConfigUpdate({ fields: updatedFields })
  }

  const handleAddField = () => {
    const newField: RecordField = {
      id: `field-${Date.now()}`,
      name: `field_${config.fields.length + 1}`,
      displayName: `Field ${config.fields.length + 1}`,
      type: 'TEXT',
      required: false,
      visible: true,
      editable: true,
      order: config.fields.length
    }
    handleConfigUpdate({ fields: [...config.fields, newField] })
  }

  const handleRemoveField = (fieldId: string) => {
    const updatedFields = config.fields.filter(field => field.id !== fieldId)
    handleConfigUpdate({ fields: updatedFields })
  }

  const renderFieldIcon = (type: string) => {
    const IconComponent = fieldTypeIcons[type] || Type
    return <IconComponent className="h-4 w-4" />
  }

  const renderFieldPreview = (field: RecordField) => {
    const IconComponent = fieldTypeIcons[field.type] || Type
    
    return (
      <div className="flex items-center gap-2 p-2 border border-border rounded">
        <IconComponent className="h-4 w-4 text-muted-foreground" />
        <div className="flex-1">
          <div className="text-sm font-medium">{field.displayName}</div>
          <div className="text-xs text-muted-foreground">{field.type}</div>
        </div>
        <div className="flex items-center gap-1">
          {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
          {!field.visible && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
          {!field.editable && <Badge variant="outline" className="text-xs">Read-only</Badge>}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Record Configuration</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure how data records are displayed and managed
        </p>
      </div>

      <div className="w-full">
      <Tabs defaultValue="source">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="source">Source</TabsTrigger>
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="styling">Styling</TabsTrigger>
        </TabsList>

        <TabsContent value="source" className="space-y-4">
          <DataSourceSelector
            onSelect={(dataModel) => {
              setSelectedDataSource(dataModel)
              handleConfigUpdate({ dataSource: dataModel?.id || '' })
            }}
            selectedModel={selectedDataSource}
          />
        </TabsContent>

        <TabsContent value="fields" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Data Fields</CardTitle>
                <Button size="sm" onClick={handleAddField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {config.fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No fields configured</p>
                  <p className="text-xs">Add fields to display data records</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {config.fields.map((field, index) => (
                    <Card key={field.id} className="p-3">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          {renderFieldIcon(field.type)}
                          <Input
                            value={field.displayName}
                            onChange={(e) => handleFieldUpdate(field.id, { displayName: e.target.value })}
                            placeholder="Field display name"
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
                            <Input
                              id={`field-name-${field.id}`}
                              value={field.name}
                              onChange={(e) => handleFieldUpdate(field.id, { name: e.target.value })}
                              placeholder="field_name"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`field-type-${field.id}`}>Type</Label>
                            <Select
                              value={field.type}
                              onValueChange={(value) => handleFieldUpdate(field.id, { type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="TEXT">Text</SelectItem>
                                <SelectItem value="NUMBER">Number</SelectItem>
                                <SelectItem value="EMAIL">Email</SelectItem>
                                <SelectItem value="PHONE">Phone</SelectItem>
                                <SelectItem value="URL">URL</SelectItem>
                                <SelectItem value="DATE">Date</SelectItem>
                                <SelectItem value="DATETIME">DateTime</SelectItem>
                                <SelectItem value="BOOLEAN">Boolean</SelectItem>
                                <SelectItem value="SELECT">Select</SelectItem>
                                <SelectItem value="MULTISELECT">Multi-Select</SelectItem>
                                <SelectItem value="TEXTAREA">Textarea</SelectItem>
                                <SelectItem value="RICH_TEXT">Rich Text</SelectItem>
                                <SelectItem value="IMAGE">Image</SelectItem>
                                <SelectItem value="FILE">File</SelectItem>
                                <SelectItem value="LOCATION">Location</SelectItem>
                                <SelectItem value="CURRENCY">Currency</SelectItem>
                                <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                <SelectItem value="RATING">Rating</SelectItem>
                                <SelectItem value="COLOR">Color</SelectItem>
                                <SelectItem value="JSON">JSON</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`field-required-${field.id}`}
                              checked={field.required}
                              onCheckedChange={(checked) => handleFieldUpdate(field.id, { required: checked })}
                            />
                            <Label htmlFor={`field-required-${field.id}`}>Required</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`field-visible-${field.id}`}
                              checked={field.visible}
                              onCheckedChange={(checked) => handleFieldUpdate(field.id, { visible: checked })}
                            />
                            <Label htmlFor={`field-visible-${field.id}`}>Visible</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`field-editable-${field.id}`}
                              checked={field.editable}
                              onCheckedChange={(checked) => handleFieldUpdate(field.id, { editable: checked })}
                            />
                            <Label htmlFor={`field-editable-${field.id}`}>Editable</Label>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Layout Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="layout-mode">Display Mode</Label>
                <Select
                  value={config.layout.mode}
                  onValueChange={(value) => handleConfigUpdate({ 
                    layout: { ...config.layout, mode: value as any }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4" />
                        Table
                      </div>
                    </SelectItem>
                    <SelectItem value="list">
                      <div className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        List
                      </div>
                    </SelectItem>
                    <SelectItem value="grid">
                      <div className="flex items-center gap-2">
                        <Grid className="h-4 w-4" />
                        Grid
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center gap-2">
                        <Layout className="h-4 w-4" />
                        Card
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="layout-columns">Columns</Label>
                <Select
                  value={config.layout.columns.toString()}
                  onValueChange={(value) => handleConfigUpdate({ 
                    layout: { ...config.layout, columns: parseInt(value) }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Column</SelectItem>
                    <SelectItem value="2">2 Columns</SelectItem>
                    <SelectItem value="3">3 Columns</SelectItem>
                    <SelectItem value="4">4 Columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="layout-density">Density</Label>
                <Select
                  value={config.layout.density}
                  onValueChange={(value) => handleConfigUpdate({ 
                    layout: { ...config.layout, density: value as any }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-headers"
                    checked={config.layout.showHeaders}
                    onCheckedChange={(checked) => handleConfigUpdate({ 
                      layout: { ...config.layout, showHeaders: checked }
                    })}
                  />
                  <Label htmlFor="show-headers">Show Headers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-borders"
                    checked={config.layout.showBorders}
                    onCheckedChange={(checked) => handleConfigUpdate({ 
                      layout: { ...config.layout, showBorders: checked }
                    })}
                  />
                  <Label htmlFor="show-borders">Show Borders</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="alternating-rows"
                    checked={config.layout.alternatingRows}
                    onCheckedChange={(checked) => handleConfigUpdate({ 
                      layout: { ...config.layout, alternatingRows: checked }
                    })}
                  />
                  <Label htmlFor="alternating-rows">Alternating Rows</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Display Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-pagination"
                    checked={config.display.showPagination}
                    onCheckedChange={(checked) => handleConfigUpdate({ 
                      display: { ...config.display, showPagination: checked }
                    })}
                  />
                  <Label htmlFor="show-pagination">Show Pagination</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-search"
                    checked={config.display.showSearch}
                    onCheckedChange={(checked) => handleConfigUpdate({ 
                      display: { ...config.display, showSearch: checked }
                    })}
                  />
                  <Label htmlFor="show-search">Show Search</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-filters"
                    checked={config.display.showFilters}
                    onCheckedChange={(checked) => handleConfigUpdate({ 
                      display: { ...config.display, showFilters: checked }
                    })}
                  />
                  <Label htmlFor="show-filters">Show Filters</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-sorting"
                    checked={config.display.showSorting}
                    onCheckedChange={(checked) => handleConfigUpdate({ 
                      display: { ...config.display, showSorting: checked }
                    })}
                  />
                  <Label htmlFor="show-sorting">Show Sorting</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-actions"
                    checked={config.display.showActions}
                    onCheckedChange={(checked) => handleConfigUpdate({ 
                      display: { ...config.display, showActions: checked }
                    })}
                  />
                  <Label htmlFor="show-actions">Show Actions</Label>
                </div>
              </div>

              {config.display.showPagination && (
                <div>
                  <Label htmlFor="page-size">Page Size</Label>
                  <Input
                    id="page-size"
                    type="number"
                    value={config.display.pageSize}
                    onChange={(e) => handleConfigUpdate({ 
                      display: { ...config.display, pageSize: parseInt(e.target.value) || 20 }
                    })}
                    min="1"
                    max="100"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-create"
                  checked={config.actions.allowCreate}
                  onCheckedChange={(checked) => handleConfigUpdate({ 
                    actions: { ...config.actions, allowCreate: checked }
                  })}
                />
                <Label htmlFor="allow-create">Allow Create</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-edit"
                  checked={config.actions.allowEdit}
                  onCheckedChange={(checked) => handleConfigUpdate({ 
                    actions: { ...config.actions, allowEdit: checked }
                  })}
                />
                <Label htmlFor="allow-edit">Allow Edit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-delete"
                  checked={config.actions.allowDelete}
                  onCheckedChange={(checked) => handleConfigUpdate({ 
                    actions: { ...config.actions, allowDelete: checked }
                  })}
                />
                <Label htmlFor="allow-delete">Allow Delete</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-export"
                  checked={config.actions.allowExport}
                  onCheckedChange={(checked) => handleConfigUpdate({ 
                    actions: { ...config.actions, allowExport: checked }
                  })}
                />
                <Label htmlFor="allow-export">Allow Export</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="allow-bulk-actions"
                  checked={config.actions.allowBulkActions}
                  onCheckedChange={(checked) => handleConfigUpdate({ 
                    actions: { ...config.actions, allowBulkActions: checked }
                  })}
                />
                <Label htmlFor="allow-bulk-actions">Allow Bulk Actions</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="styling" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Styling Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={config.styling.theme}
                  onValueChange={(value) => handleConfigUpdate({ 
                    styling: { ...config.styling, theme: value as any }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="font-size">Font Size</Label>
                <Select
                  value={config.styling.fontSize}
                  onValueChange={(value) => handleConfigUpdate({ 
                    styling: { ...config.styling, fontSize: value as any }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="border-radius">Border Radius</Label>
                <Input
                  id="border-radius"
                  type="number"
                  value={config.styling.borderRadius}
                  onChange={(e) => handleConfigUpdate({ 
                    styling: { ...config.styling, borderRadius: parseInt(e.target.value) || 8 }
                  })}
                  min="0"
                  max="20"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>

      {/* Preview Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </div>

      {/* Preview */}
      {showPreview && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <RecordPreview config={config} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
