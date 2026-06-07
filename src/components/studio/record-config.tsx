'use client'

import { useEffect, useState } from 'react'
import { Database, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { DataSourceSelector } from './data-source-selector'
import { defaultRecordConfig, type RecordConfigData, type RecordField } from './record-config-model'
import { RecordDisplayTab } from './RecordDisplayTab'
import { RecordFieldsTab } from './RecordFieldsTab'
import { RecordLayoutTab } from './RecordLayoutTab'
import { RecordPreview } from './record-preview'
import { RecordStylingTab } from './RecordStylingTab'

interface RecordConfigProps {
  component: any
  onUpdate: (config: any) => void
}

export function RecordConfig({ component, onUpdate }: RecordConfigProps) {
  const [config, setConfig] = useState<RecordConfigData>(defaultRecordConfig)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedDataSource, setSelectedDataSource] = useState<any>(null)

  useEffect(() => {
    if (component?.config?.recordConfig) {
      setConfig(component.config.recordConfig)
    }
  }, [component])

  const handleConfigUpdate = (updates: Partial<RecordConfigData>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    onUpdate({ ...component, config: { ...component.config, recordConfig: newConfig } })
  }

  const handleFieldUpdate = (fieldId: string, updates: Partial<RecordField>) => {
    const updatedFields = config.fields.map((field) => (
      field.id === fieldId ? { ...field, ...updates } : field
    ))
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
    handleConfigUpdate({ fields: config.fields.filter((field) => field.id !== fieldId) })
  }

  return (
    <div className="space-y-4 p-4">
      <div className="mb-4">
        <div className="mb-2 flex items-center gap-2">
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
            <RecordFieldsTab
              fields={config.fields}
              onAddField={handleAddField}
              onFieldUpdate={handleFieldUpdate}
              onRemoveField={handleRemoveField}
            />
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <RecordLayoutTab config={config} onConfigUpdate={handleConfigUpdate} />
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <RecordDisplayTab config={config} onConfigUpdate={handleConfigUpdate} />
          </TabsContent>

          <TabsContent value="styling" className="space-y-4">
            <RecordStylingTab config={config} onConfigUpdate={handleConfigUpdate} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
          <Eye className="mr-2 h-4 w-4" />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </Button>
      </div>

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
