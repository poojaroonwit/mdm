import { Database, Settings } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaxonomyBadge } from '@/components/ui/taxonomy-badge'

import type { DataModel, Relationship, RelationshipTypeInfo } from './relationship-manager-model'
import { RELATIONSHIP_TYPES } from './relationship-manager-model'

interface RelationshipDetailCardProps {
  relationship: Relationship
  dataModels: DataModel[]
  canEditRelationship: boolean
  getRelationshipTypeInfo: (type: string) => RelationshipTypeInfo
  getModelName: (modelId: string) => string
  getAttributeName: (modelId: string, attributeId: string) => string
  onUpdateRelationship: (id: string, updates: Partial<Relationship>) => void
}

export function RelationshipDetailCard({
  relationship,
  dataModels,
  canEditRelationship,
  getRelationshipTypeInfo,
  getModelName,
  getAttributeName,
  onUpdateRelationship
}: RelationshipDetailCardProps) {
  const update = (updates: Partial<Relationship>) => onUpdateRelationship(relationship.id, updates)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {relationship.name}
          <div className="flex items-center gap-2">
            <StatusBadge status={relationship.is_active ? 'active' : 'inactive'} />
            <Button size="sm" variant="outline">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
        <CardDescription>{relationship.description}</CardDescription>
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
                    value={relationship.name}
                    onChange={(event) => update({ name: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship-type">Type</Label>
                  <Select value={relationship.type} onValueChange={(type) => update({ type: type as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map((type) => (
                        <SelectItem key={type.type} value={type.type}>
                          <div className="flex items-center gap-2">
                            <span className={`rounded px-2 py-1 text-xs text-white ${type.color}`}>
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
                <ModelSelect
                  id="source-model"
                  label="Source Model"
                  value={relationship.source_model}
                  models={dataModels}
                  onValueChange={(source_model) => update({ source_model })}
                />
                <ModelSelect
                  id="target-model"
                  label="Target Model"
                  value={relationship.target_model}
                  models={dataModels.filter((model) => model.id !== relationship.source_model)}
                  onValueChange={(target_model) => update({ target_model })}
                />
              </div>

              {(relationship.type === 'one_to_one' || relationship.type === 'one_to_many') && (
                <div className="grid grid-cols-2 gap-4">
                  <AttributeSelect
                    id="source-attribute"
                    label="Source Attribute"
                    value={relationship.source_attribute || ''}
                    attributes={dataModels.find((model) => model.id === relationship.source_model)?.attributes || []}
                    onValueChange={(source_attribute) => update({ source_attribute })}
                  />
                  <AttributeSelect
                    id="target-attribute"
                    label="Target Attribute"
                    value={relationship.target_attribute || ''}
                    attributes={dataModels.find((model) => model.id === relationship.target_model)?.attributes || []}
                    onValueChange={(target_attribute) => update({ target_attribute })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="relationship-description">Description</Label>
                <Input
                  id="relationship-description"
                  value={relationship.description}
                  onChange={(event) => update({ description: event.target.value })}
                  disabled={!canEditRelationship}
                  placeholder="Enter relationship description"
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Cascade Options</h4>
                <CascadeToggle
                  id="cascade-delete"
                  label="Cascade Delete"
                  description="Delete related records when source record is deleted"
                  checked={relationship.cascade_delete}
                  onCheckedChange={(cascade_delete) => update({ cascade_delete })}
                />
                <CascadeToggle
                  id="cascade-update"
                  label="Cascade Update"
                  description="Update related records when source record is updated"
                  checked={relationship.cascade_update}
                  onCheckedChange={(cascade_update) => update({ cascade_update })}
                />
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h4 className="mb-2 font-medium">Relationship Preview</h4>
                <div className="space-y-2 text-sm">
                  <PreviewRow label="Type">
                    <TaxonomyBadge
                      taxonomy="relationship"
                      value={relationship.type}
                      label={getRelationshipTypeInfo(relationship.type).name}
                    />
                  </PreviewRow>
                  <PreviewRow label="Source">{getModelName(relationship.source_model)}</PreviewRow>
                  <PreviewRow label="Target">{getModelName(relationship.target_model)}</PreviewRow>
                  {relationship.source_attribute && (
                    <PreviewRow label="Source Attribute">
                      {getAttributeName(relationship.source_model, relationship.source_attribute)}
                    </PreviewRow>
                  )}
                  {relationship.target_attribute && (
                    <PreviewRow label="Target Attribute">
                      {getAttributeName(relationship.target_model, relationship.target_attribute)}
                    </PreviewRow>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="space-y-4">
              <div className="py-8 text-center text-muted-foreground">
                <Database className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Relationship testing tools will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}

function ModelSelect({
  id,
  label,
  value,
  models,
  onValueChange
}: {
  id: string
  label: string
  value: string
  models: DataModel[]
  onValueChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function AttributeSelect({
  id,
  label,
  value,
  attributes,
  onValueChange
}: {
  id: string
  label: string
  value: string
  attributes: DataModel['attributes']
  onValueChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {attributes.map((attribute) => (
            <SelectItem key={attribute.id} value={attribute.id}>
              {attribute.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function CascadeToggle({
  id,
  label,
  description,
  checked,
  onCheckedChange
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function PreviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-medium">{label}:</span>
      <span>{children}</span>
    </div>
  )
}
