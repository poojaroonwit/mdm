'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Database, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSpacePermissions } from '@/hooks/use-space-permissions'

import { CreateRelationshipDialog } from './CreateRelationshipDialog'
import { RelationshipDetailCard } from './RelationshipDetailCard'
import {
  emptyRelationshipDraft,
  RELATIONSHIP_TYPES,
  validateRelationship,
  type DataModel,
  type NewRelationshipDraft,
  type Relationship
} from './relationship-manager-model'

interface RelationshipManagerProps {
  spaceId: string
  dataModels: DataModel[]
  relationships: Relationship[]
  onRelationshipsChange: (relationships: Relationship[]) => void
}

export function RelationshipManager({
  dataModels,
  relationships,
  onRelationshipsChange
}: RelationshipManagerProps) {
  const permissions = useSpacePermissions()
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newRelationship, setNewRelationship] = useState<NewRelationshipDraft>(emptyRelationshipDraft)

  const canCreateRelationship = permissions.canCreate
  const canEditRelationship = permissions.canEdit

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
    setNewRelationship(emptyRelationshipDraft)
  }

  const updateRelationship = (id: string, updates: Partial<Relationship>) => {
    const updatedRelationships = relationships.map((relationship) => (
      relationship.id === id ? { ...relationship, ...updates, updated_at: new Date() } : relationship
    ))
    onRelationshipsChange(updatedRelationships)
    if (selectedRelationship?.id === id) {
      setSelectedRelationship((current) => current ? { ...current, ...updates } : null)
    }
  }

  const getRelationshipTypeInfo = (type: string) => {
    return RELATIONSHIP_TYPES.find((item) => item.type === type) || RELATIONSHIP_TYPES[0]
  }

  const getModelName = (modelId: string) => {
    return dataModels.find((model) => model.id === modelId)?.display_name || modelId
  }

  const getAttributeName = (modelId: string, attributeId: string) => {
    const model = dataModels.find((item) => item.id === modelId)
    const attribute = model?.attributes.find((item) => item.id === attributeId)
    return attribute?.display_name || attributeId
  }

  const getSourceModelAttributes = () => {
    if (!newRelationship.source_model) return []
    return dataModels.find((model) => model.id === newRelationship.source_model)?.attributes || []
  }

  const getTargetModelAttributes = () => {
    if (!newRelationship.target_model) return []
    return dataModels.find((model) => model.id === newRelationship.target_model)?.attributes || []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relationship Manager</h2>
          <p className="text-muted-foreground">Define relationships between data models</p>
        </div>
        {canCreateRelationship && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relationships.map((relationship) => (
                <RelationshipSummaryCard
                  key={relationship.id}
                  relationship={relationship}
                  selected={selectedRelationship?.id === relationship.id}
                  getRelationshipTypeInfo={getRelationshipTypeInfo}
                  getModelName={getModelName}
                  getAttributeName={getAttributeName}
                  onSelect={setSelectedRelationship}
                />
              ))}
            </div>

            {selectedRelationship && (
              <RelationshipDetailCard
                relationship={selectedRelationship}
                dataModels={dataModels}
                canEditRelationship={canEditRelationship}
                getRelationshipTypeInfo={getRelationshipTypeInfo}
                getModelName={getModelName}
                getAttributeName={getAttributeName}
                onUpdateRelationship={updateRelationship}
              />
            )}
          </TabsContent>

          <TabsContent value="visualization" className="space-y-4">
            <div className="py-8 text-center text-muted-foreground">
              <Database className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Relationship visualization will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <div className="space-y-3">
              {relationships.map((relationship) => (
                <RelationshipValidationCard
                  key={relationship.id}
                  relationship={relationship}
                  getModelName={getModelName}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {showCreateDialog && (
        <CreateRelationshipDialog
          newRelationship={newRelationship}
          dataModels={dataModels}
          sourceAttributes={getSourceModelAttributes()}
          targetAttributes={getTargetModelAttributes()}
          setNewRelationship={setNewRelationship}
          onCreateRelationship={createRelationship}
          onClose={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  )
}

function RelationshipSummaryCard({
  relationship,
  selected,
  getRelationshipTypeInfo,
  getModelName,
  getAttributeName,
  onSelect
}: {
  relationship: Relationship
  selected: boolean
  getRelationshipTypeInfo: (type: string) => (typeof RELATIONSHIP_TYPES)[number]
  getModelName: (modelId: string) => string
  getAttributeName: (modelId: string, attributeId: string) => string
  onSelect: (relationship: Relationship) => void
}) {
  const validation = validateRelationship(relationship)
  const typeInfo = getRelationshipTypeInfo(relationship.type)

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${selected ? 'ring-2 ring-primary' : ''} ${!validation.valid ? 'border-red-200' : ''}`}
      onClick={() => onSelect(relationship)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 text-xs font-bold text-white ${typeInfo.color}`}>
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
          <SummaryRow label="Source" value={getModelName(relationship.source_model)} />
          <SummaryRow label="Target" value={getModelName(relationship.target_model)} />
          {relationship.source_attribute && (
            <SummaryRow
              label="Source Attr"
              value={getAttributeName(relationship.source_model, relationship.source_attribute)}
            />
          )}
          {relationship.target_attribute && (
            <SummaryRow
              label="Target Attr"
              value={getAttributeName(relationship.target_model, relationship.target_attribute)}
            />
          )}
          {!validation.valid && (
            <div className="mt-2 text-xs text-red-600">{validation.errors.join(', ')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function RelationshipValidationCard({
  relationship,
  getModelName
}: {
  relationship: Relationship
  getModelName: (modelId: string) => string
}) {
  const validation = validateRelationship(relationship)

  return (
    <Card className={!validation.valid ? 'border-red-200' : ''}>
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
                {getModelName(relationship.source_model)} -&gt; {getModelName(relationship.target_model)}
              </div>
            </div>
          </div>
          <StatusBadge status={validation.valid ? 'valid' : 'invalid'} />
        </div>
        {!validation.valid && (
          <div className="mt-2 text-sm text-red-600">{validation.errors.join(', ')}</div>
        )}
      </CardContent>
    </Card>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
