import type { Dispatch, SetStateAction } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { Attribute, DataModel, NewRelationshipDraft } from './relationship-manager-model'
import { RELATIONSHIP_TYPES } from './relationship-manager-model'

interface CreateRelationshipDialogProps {
  newRelationship: NewRelationshipDraft
  dataModels: DataModel[]
  sourceAttributes: Attribute[]
  targetAttributes: Attribute[]
  setNewRelationship: Dispatch<SetStateAction<NewRelationshipDraft>>
  onCreateRelationship: () => void
  onClose: () => void
}

export function CreateRelationshipDialog({
  newRelationship,
  dataModels,
  sourceAttributes,
  targetAttributes,
  setNewRelationship,
  onCreateRelationship,
  onClose
}: CreateRelationshipDialogProps) {
  const updateDraft = (updates: Partial<NewRelationshipDraft>) => {
    setNewRelationship((current) => ({ ...current, ...updates }))
  }

  return (
    <Card className="fixed inset-0 z-50 m-4 max-w-2xl">
      <CardHeader>
        <CardTitle>Create New Relationship</CardTitle>
        <CardDescription>Define a relationship between two data models</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-relationship-name">Relationship Name</Label>
            <Input
              id="new-relationship-name"
              value={newRelationship.name}
              onChange={(event) => updateDraft({ name: event.target.value })}
              placeholder="Enter relationship name"
            />
          </div>
          <RelationshipTypeSelect value={newRelationship.type} onValueChange={(type) => updateDraft({ type })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ModelSelect
            id="new-source-model"
            label="Source Model"
            value={newRelationship.source_model}
            models={dataModels}
            onValueChange={(source_model) => updateDraft({ source_model })}
          />
          <ModelSelect
            id="new-target-model"
            label="Target Model"
            value={newRelationship.target_model}
            models={dataModels.filter((model) => model.id !== newRelationship.source_model)}
            onValueChange={(target_model) => updateDraft({ target_model })}
          />
        </div>

        {(newRelationship.type === 'one_to_one' || newRelationship.type === 'one_to_many') && (
          <div className="grid grid-cols-2 gap-4">
            <AttributeSelect
              id="new-source-attribute"
              label="Source Attribute"
              value={newRelationship.source_attribute}
              attributes={sourceAttributes}
              onValueChange={(source_attribute) => updateDraft({ source_attribute })}
            />
            <AttributeSelect
              id="new-target-attribute"
              label="Target Attribute"
              value={newRelationship.target_attribute}
              attributes={targetAttributes}
              onValueChange={(target_attribute) => updateDraft({ target_attribute })}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="new-relationship-description">Description</Label>
          <Input
            id="new-relationship-description"
            value={newRelationship.description}
            onChange={(event) => updateDraft({ description: event.target.value })}
            placeholder="Enter relationship description"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onCreateRelationship}
            disabled={!newRelationship.name.trim() || !newRelationship.source_model || !newRelationship.target_model}
          >
            Create Relationship
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RelationshipTypeSelect({
  value,
  onValueChange
}: {
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="new-relationship-type">Type</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RELATIONSHIP_TYPES.map((type) => (
            <SelectItem key={type.type} value={type.type}>
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-1 text-xs text-white ${type.color}`}>{type.icon}</span>
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
  attributes: Attribute[]
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
