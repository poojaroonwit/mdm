'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  GitBranch, 
  Settings, 
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import ERDDiagram from '@/components/erd/ERDDiagram'
import ERDNavigation, { ERDStats } from '@/components/erd/ERDNavigation'

interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
  attributes: Attribute[]
  position?: { x: number; y: number }
}

interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
  is_primary_key?: boolean
  is_foreign_key?: boolean
  referenced_table?: string
  referenced_column?: string
}

interface Relationship {
  id: string
  fromModel: string
  toModel: string
  fromAttribute: string
  toAttribute: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  label?: string
}

export default function ERDViewPage() {
  const [models, setModels] = useState<DataModel[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [autoLayout, setAutoLayout] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load data models
      const modelsRes = await fetch('/api/data-models')
      const modelsData = await modelsRes.json()
      
      const modelsWithAttributes: DataModel[] = []
      
      // Load attributes for each model
      for (const model of modelsData.dataModels || []) {
        try {
          const attrsRes = await fetch(`/api/data-models/${model.id}/attributes`)
          const attrsData = await attrsRes.json()
          
          modelsWithAttributes.push({
            ...model,
            attributes: attrsData.attributes || []
          })
        } catch (error) {
          console.error(`Error loading attributes for model ${model.id}:`, error)
          modelsWithAttributes.push({
            ...model,
            attributes: []
          })
        }
      }
      
      setModels(modelsWithAttributes)
      
      // Load relationships (this would need to be implemented in the API)
      // For now, we'll create some sample relationships based on foreign keys
      const sampleRelationships: Relationship[] = []
      modelsWithAttributes.forEach(model => {
        model.attributes.forEach(attr => {
          if (attr.is_foreign_key && attr.referenced_table) {
            const targetModel = modelsWithAttributes.find(m => 
              m.name.toLowerCase() === attr.referenced_table?.toLowerCase()
            )
            if (targetModel) {
              const targetAttr = targetModel.attributes.find(a => 
                a.name.toLowerCase() === attr.referenced_column?.toLowerCase() ||
                a.is_primary_key
              )
              if (targetAttr) {
                sampleRelationships.push({
                  id: `${model.id}-${attr.id}-${targetModel.id}-${targetAttr.id}`,
                  fromModel: model.id,
                  toModel: targetModel.id,
                  fromAttribute: attr.id,
                  toAttribute: targetAttr.id,
                  type: 'one-to-many',
                  label: `${model.display_name} → ${targetModel.display_name}`
                })
              }
            }
          }
        })
      })
      
      setRelationships(sampleRelationships)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateModel = async (updatedModel: DataModel) => {
    setModels(prev => prev.map(m => m.id === updatedModel.id ? updatedModel : m))
  }

  const handleUpdateAttribute = async (modelId: string, attribute: Attribute) => {
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes/${attribute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attribute)
      })
      
      if (res.ok) {
        setModels(prev => prev.map(model => 
          model.id === modelId 
            ? { ...model, attributes: model.attributes.map(attr => 
                attr.id === attribute.id ? attribute : attr
              )}
            : model
        ))
      }
    } catch (error) {
      console.error('Error updating attribute:', error)
    }
  }

  const handleDeleteAttribute = async (modelId: string, attributeId: string) => {
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes/${attributeId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setModels(prev => prev.map(model => 
          model.id === modelId 
            ? { ...model, attributes: model.attributes.filter(attr => attr.id !== attributeId)}
            : model
        ))
      }
    } catch (error) {
      console.error('Error deleting attribute:', error)
    }
  }

  const handleCreateRelationship = async (relationship: Omit<Relationship, 'id'>) => {
    // This would need to be implemented in the API
    const newRelationship: Relationship = {
      ...relationship,
      id: `${relationship.fromModel}-${relationship.fromAttribute}-${relationship.toModel}-${relationship.toAttribute}`
    }
    setRelationships(prev => [...prev, newRelationship])
  }

  const handleUpdateRelationship = async (relationship: Relationship) => {
    setRelationships(prev => prev.map(r => r.id === relationship.id ? relationship : r))
  }

  const handleDeleteRelationship = async (relationshipId: string) => {
    setRelationships(prev => prev.filter(r => r.id !== relationshipId))
  }

  const handleSaveLayout = async () => {
    setSaving(true)
    try {
      // Save model positions and relationships
      const layoutData = {
        models: models.map(m => ({ id: m.id, position: m.position })),
        relationships
      }
      
      // This would need to be implemented in the API
      console.log('Saving layout:', layoutData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error('Error saving layout:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAutoLayout = () => {
    const cols = Math.ceil(Math.sqrt(models.length))
    const spacing = 300
    
    setModels(prev => prev.map((model, index) => ({
      ...model,
      position: {
        x: 100 + (index % cols) * spacing,
        y: 100 + Math.floor(index / cols) * 250
      }
    })))
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading ERD diagram...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Navigation */}
        <ERDNavigation
          modelCount={models.length}
          relationshipCount={relationships.length}
          attributeCount={models.reduce((sum, model) => sum + model.attributes.length, 0)}
          onToggleGrid={() => setShowGrid(!showGrid)}
          showGrid={showGrid}
          onAutoLayout={handleAutoLayout}
          onSaveLayout={handleSaveLayout}
          saving={saving}
        />

        {/* Stats */}
        <ERDStats
          modelCount={models.length}
          relationshipCount={relationships.length}
          attributeCount={models.reduce((sum, model) => sum + model.attributes.length, 0)}
        />

        {/* Main Content */}
        <div className="w-full">
        <Tabs defaultValue="diagram">
          <TabsList>
            <TabsTrigger value="diagram" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Diagram View
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Model List
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="diagram" className="mt-6">
            <Card className="h-[600px]">
              <CardContent className="p-0 h-full">
                <ERDDiagram
                  models={models}
                  onUpdateModel={handleUpdateModel}
                  onUpdateAttribute={handleUpdateAttribute}
                  onDeleteAttribute={handleDeleteAttribute}
                  onCreateRelationship={handleCreateRelationship}
                  onUpdateRelationship={handleUpdateRelationship}
                  onDeleteRelationship={handleDeleteRelationship}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            <div className="space-y-4">
              {models.map((model) => (
                <Card key={model.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      {model.display_name}
                      <Badge variant="secondary">
                        {model.attributes.length} attributes
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {model.attributes.map((attr) => (
                        <div
                          key={attr.id}
                          className="flex items-center gap-2 p-2 border border-border rounded"
                        >
                          <span className="font-medium">{attr.display_name}</span>
                          <Badge variant="outline">{attr.type}</Badge>
                          {attr.is_primary_key && (
                            <Badge variant="default">PK</Badge>
                          )}
                          {attr.is_foreign_key && (
                            <Badge variant="secondary">FK</Badge>
                          )}
                          {attr.is_required && (
                            <Badge variant="destructive">Required</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
