'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { TaxonomyBadge } from '@/components/ui/taxonomy-badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Trash2, 
  Edit, 
  Copy, 
  Settings,
  Link,
  Unlink,
  ArrowRight,
  ArrowLeft,
  Database,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { useSpacePermissions } from '@/hooks/use-space-permissions'

interface DataModel {
  id: string
  name: string
  display_name: string
  attributes: Attribute[]
}

interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
}

interface Relationship {
  id: string
  name: string
  description: string
  type: 'one_to_one' | 'one_to_many' | 'many_to_many'
  source_model: string
  target_model: string
  source_attribute?: string
  target_attribute?: string
  cascade_delete: boolean
  cascade_update: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

interface RelationshipManagerProps {
  spaceId: string
  dataModels: DataModel[]
  relationships: Relationship[]
  onRelationshipsChange: (relationships: Relationship[]) => void
}

const RELATIONSHIP_TYPES = [
  {
    type: 'one_to_one',
    name: 'One-to-One',
    description: 'Each record in source model relates to exactly one record in target model',
    icon: '1:1',
    color: 'bg-blue-500'
  },
  {
    type: 'one_to_many',
    name: 'One-to-Many',
    description: 'One record in source model can relate to many records in target model',
    icon: '1:N',
    color: 'bg-green-500'
  },
  {
    type: 'many_to_many',
    name: 'Many-to-Many',
    description: 'Many records in source model can relate to many records in target model',
    icon: 'N:N',
    color: 'bg-purple-500'
  }
]

export function RelationshipManager({ 
  spaceId, 
  dataModels, 
  relationships, 
  onRelationshipsChange 
}: RelationshipManagerProps) {
  const permissions = useSpacePermissions()
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newRelationship, setNewRelationship] = useState({
    name: '',
    description: '',
    type: 'one_to_many' as string,
    source_model: '',
    target_model: '',
    source_attribute: '',
    target_attribute: '',
    cascade_delete: false,
    cascade_update: true
  })

  const canCreateRelationship = permissions.canCreate
  const canEditRelationship = permissions.canEdit
  const canDeleteRelationship = permissions.canDelete

  const createRelationship = () => {
    if (!newRelationship.name.trim() || !newRelationship.source_model || !newRelationship.target_model) {
      return
    }

    const relationship: Relationship = {
      id: `relationship_${Date.now()}`,
      name: newRelationship.name,
      description: newRelationship.description,
      type: newRelationship.type as any,
      source_model: newRelationship.source_model,
      target_model: newRelationship.target_model,
      source_attribute: newRelationship.source_attribute || undefined,
      target_attribute: newRelationship.target_attribute || undefined,
      cascade_delete: newRelationship.cascade_delete,
      cascade_update: newRelationship.cascade_update,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }

    onRelationshipsChange([...relationships, relationship])
    setSelectedRelationship(relationship)
    setShowCreateDialog(false)
    setNewRelationship({
      name: '',
      description: '',
      type: 'one_to_many',
      source_model: '',
      target_model: '',
      source_attribute: '',
      target_attribute: '',
      cascade_delete: false,
      cascade_update: true
    })
  }

  const updateRelationship = (id: string, updates: Partial<Relationship>) => {
    const updatedRelationships = relationships.map(rel => 
      rel.id === id ? { ...rel, ...updates, updated_at: new Date() } : rel
    )
    onRelationshipsChange(updatedRelationships)
    if (selectedRelationship?.id === id) {
      setSelectedRelationship(prev => prev ? { ...prev, ...updates } : null)
    }
  }

  const deleteRelationship = (id: string) => {
    onRelationshipsChange(relationships.filter(rel => rel.id !== id))
    if (selectedRelationship?.id === id) {
      setSelectedRelationship(null)
    }
  }

  const getRelationshipTypeInfo = (type: string) => {
    return RELATIONSHIP_TYPES.find(t => t.type === type) || RELATIONSHIP_TYPES[0]
  }

  const getModelName = (modelId: string) => {
    return dataModels.find(m => m.id === modelId)?.display_name || modelId
  }

  const getAttributeName = (modelId: string, attributeId: string) => {
    const model = dataModels.find(m => m.id === modelId)
    const attribute = model?.attributes.find(a => a.id === attributeId)
    return attribute?.display_name || attributeId
  }

  const getSourceModelAttributes = () => {
    if (!newRelationship.source_model) return []
    const model = dataModels.find(m => m.id === newRelationship.source_model)
    return model?.attributes || []
  }

  const getTargetModelAttributes = () => {
    if (!newRelationship.target_model) return []
    const model = dataModels.find(m => m.id === newRelationship.target_model)
    return model?.attributes || []
  }

  const validateRelationship = (relationship: Relationship): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!relationship.name.trim()) {
      errors.push('Relationship name is required')
    }

    if (!relationship.source_model) {
      errors.push('Source model is required')
    }

    if (!relationship.target_model) {
      errors.push('Target model is required')
    }

    if (relationship.source_model === relationship.target_model) {
      errors.push('Source and target models must be different')
    }

    if (relationship.type === 'one_to_one' || relationship.type === 'one_to_many') {
      if (!relationship.source_attribute) {
        errors.push('Source attribute is required for this relationship type')
      }
      if (!relationship.target_attribute) {
        errors.push('Target attribute is required for this relationship type')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relationship Manager</h2>
          <p className="text-muted-foreground">
            Define relationships between data models
          </p>
        </div>
        {canCreateRelationship && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Relationship
          </Button>
        )}
      </div>

      <div className="w-full">
      <Tabs defaultValue="relationships">
        <TabsList>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="relationships" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relationships.map((relationship) => {
              const validation = validateRelationship(relationship)
              const typeInfo = getRelationshipTypeInfo(relationship.type)
              
              return (
                <Card 
                  key={relationship.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRelationship?.id === relationship.id ? 'ring-2 ring-primary' : ''
                  } ${!validation.valid ? 'border-red-200' : ''}`}
                  onClick={() => setSelectedRelationship(relationship)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${typeInfo.color} text-white text-xs font-bold`}>
                          {typeInfo.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{relationship.name}</CardTitle>
                          <CardDescription>{relationship.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {validation.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <StatusBadge status={relationship.is_active ? 'active' : 'inactive'} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Source:</span>
                        <span className="font-medium">{getModelName(relationship.source_model)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Target:</span>
                        <span className="font-medium">{getModelName(relationship.target_model)}</span>
                      </div>
                      {relationship.source_attribute && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Source Attr:</span>
                          <span className="font-medium">
                            {getAttributeName(relationship.source_model, relationship.source_attribute)}
                          </span>
                        </div>
                      )}
                      {relationship.target_attribute && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Target Attr:</span>
                          <span className="font-medium">
                            {getAttributeName(relationship.target_model, relationship.target_attribute)}
                          </span>
                        </div>
                      )}
                      {!validation.valid && (
                        <div className="text-xs text-red-600 mt-2">
                          {validation.errors.join(', ')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {selectedRelationship && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedRelationship.name}
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedRelationship.is_active ? 'active' : 'inactive'} />
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{selectedRelationship.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full">
                <Tabs defaultValue="config">
                  <TabsList>
                    <TabsTrigger value="config">Configuration</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="testing">Testing</TabsTrigger>
                  </TabsList>

                  <TabsContent value="config" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="relationship-name">Relationship Name</Label>
                        <Input
                          id="relationship-name"
                          value={selectedRelationship.name}
                          onChange={(e) => updateRelationship(selectedRelationship.id, { name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relationship-type">Type</Label>
                        <Select
                          value={selectedRelationship.type}
                          onValueChange={(type) => updateRelationship(selectedRelationship.id, { type: type as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIP_TYPES.map((type) => (
                              <SelectItem key={type.type} value={type.type}>
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 rounded text-xs text-white ${type.color}`}>
                                    {type.icon}
                                  </span>
                                  <div>
                                    <div className="font-medium">{type.name}</div>
                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="source-model">Source Model</Label>
                        <Select
                          value={selectedRelationship.source_model}
                          onValueChange={(source_model) => updateRelationship(selectedRelationship.id, { source_model })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source model" />
                          </SelectTrigger>
                          <SelectContent>
                            {dataModels.map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-model">Target Model</Label>
                        <Select
                          value={selectedRelationship.target_model}
                          onValueChange={(target_model) => updateRelationship(selectedRelationship.id, { target_model })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select target model" />
                          </SelectTrigger>
                          <SelectContent>
                            {dataModels.filter(m => m.id !== selectedRelationship.source_model).map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.display_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(selectedRelationship.type === 'one_to_one' || selectedRelationship.type === 'one_to_many') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="source-attribute">Source Attribute</Label>
                          <Select
                            value={selectedRelationship.source_attribute || ''}
                            onValueChange={(source_attribute) => updateRelationship(selectedRelationship.id, { source_attribute })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source attribute" />
                            </SelectTrigger>
                            <SelectContent>
                              {dataModels.find(m => m.id === selectedRelationship.source_model)?.attributes.map((attr) => (
                                <SelectItem key={attr.id} value={attr.id}>
                                  {attr.display_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="target-attribute">Target Attribute</Label>
                          <Select
                            value={selectedRelationship.target_attribute || ''}
                            onValueChange={(target_attribute) => updateRelationship(selectedRelationship.id, { target_attribute })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target attribute" />
                            </SelectTrigger>
                            <SelectContent>
                              {dataModels.find(m => m.id === selectedRelationship.target_model)?.attributes.map((attr) => (
                                <SelectItem key={attr.id} value={attr.id}>
                                  {attr.display_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="relationship-description">Description</Label>
                      <Input
                        id="relationship-description"
                        value={selectedRelationship.description}
                        onChange={(e) => updateRelationship(selectedRelationship.id, { description: e.target.value })}
                        disabled={!canEditRelationship}
                        placeholder="Enter relationship description"
                      />
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Cascade Options</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="cascade-delete">Cascade Delete</Label>
                            <p className="text-sm text-muted-foreground">
                              Delete related records when source record is deleted
                            </p>
                          </div>
                          <Switch
                            id="cascade-delete"
                            checked={selectedRelationship.cascade_delete}
                            onCheckedChange={(cascade_delete) => updateRelationship(selectedRelationship.id, { cascade_delete })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="cascade-update">Cascade Update</Label>
                            <p className="text-sm text-muted-foreground">
                              Update related records when source record is updated
                            </p>
                          </div>
                          <Switch
                            id="cascade-update"
                            checked={selectedRelationship.cascade_update}
                            onCheckedChange={(cascade_update) => updateRelationship(selectedRelationship.id, { cascade_update })}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="preview" className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-medium mb-2">Relationship Preview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Type:</span>
                          <TaxonomyBadge
                            taxonomy="relationship"
                            value={selectedRelationship.type}
                            label={getRelationshipTypeInfo(selectedRelationship.type).name}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Source:</span>
                          <span>{getModelName(selectedRelationship.source_model)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Target:</span>
                          <span>{getModelName(selectedRelationship.target_model)}</span>
                        </div>
                        {selectedRelationship.source_attribute && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Source Attribute:</span>
                            <span>{getAttributeName(selectedRelationship.source_model, selectedRelationship.source_attribute)}</span>
                          </div>
                        )}
                        {selectedRelationship.target_attribute && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Target Attribute:</span>
                            <span>{getAttributeName(selectedRelationship.target_model, selectedRelationship.target_attribute)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="testing" className="space-y-4">
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Relationship testing tools will appear here</p>
                    </div>
                  </TabsContent>
                </Tabs>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visualization" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Relationship visualization will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <div className="space-y-3">
            {relationships.map((relationship) => {
              const validation = validateRelationship(relationship)
              return (
                <Card key={relationship.id} className={!validation.valid ? 'border-red-200' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {validation.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{relationship.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {getModelName(relationship.source_model)} → {getModelName(relationship.target_model)}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={validation.valid ? 'valid' : 'invalid'} />
                    </div>
                    {!validation.valid && (
                      <div className="mt-2 text-sm text-red-600">
                        {validation.errors.join(', ')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
      </div>

      {showCreateDialog && (
        <Card className="fixed inset-0 z-50 m-4 max-w-2xl">
          <CardHeader>
            <CardTitle>Create New Relationship</CardTitle>
            <CardDescription>
              Define a relationship between two data models
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-relationship-name">Relationship Name</Label>
                <Input
                  id="new-relationship-name"
                  value={newRelationship.name}
                  onChange={(e) => setNewRelationship({ ...newRelationship, name: e.target.value })}
                  placeholder="Enter relationship name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-relationship-type">Type</Label>
                <Select
                  value={newRelationship.type}
                  onValueChange={(type) => setNewRelationship({ ...newRelationship, type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <SelectItem key={type.type} value={type.type}>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs text-white ${type.color}`}>
                            {type.icon}
                          </span>
                          <div>
                            <div className="font-medium">{type.name}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-source-model">Source Model</Label>
                <Select
                  value={newRelationship.source_model}
                  onValueChange={(source_model) => setNewRelationship({ ...newRelationship, source_model })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source model" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-target-model">Target Model</Label>
                <Select
                  value={newRelationship.target_model}
                  onValueChange={(target_model) => setNewRelationship({ ...newRelationship, target_model })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target model" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataModels.filter(m => m.id !== newRelationship.source_model).map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(newRelationship.type === 'one_to_one' || newRelationship.type === 'one_to_many') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-source-attribute">Source Attribute</Label>
                  <Select
                    value={newRelationship.source_attribute}
                    onValueChange={(source_attribute) => setNewRelationship({ ...newRelationship, source_attribute })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSourceModelAttributes().map((attr) => (
                        <SelectItem key={attr.id} value={attr.id}>
                          {attr.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-target-attribute">Target Attribute</Label>
                  <Select
                    value={newRelationship.target_attribute}
                    onValueChange={(target_attribute) => setNewRelationship({ ...newRelationship, target_attribute })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target attribute" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTargetModelAttributes().map((attr) => (
                        <SelectItem key={attr.id} value={attr.id}>
                          {attr.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-relationship-description">Description</Label>
              <Input
                id="new-relationship-description"
                value={newRelationship.description}
                onChange={(e) => setNewRelationship({ ...newRelationship, description: e.target.value })}
                placeholder="Enter relationship description"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={createRelationship} 
                disabled={!newRelationship.name.trim() || !newRelationship.source_model || !newRelationship.target_model}
              >
                Create Relationship
              </Button>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
