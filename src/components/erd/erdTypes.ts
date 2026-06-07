export interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
  attributes: Attribute[]
  position?: { x: number; y: number }
}

export interface Attribute {
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

export interface Relationship {
  id: string
  fromModel: string
  toModel: string
  fromAttribute: string
  toAttribute: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  label?: string
}

export interface ERDDiagramProps {
  models: DataModel[]
  relationships?: Relationship[]
  onUpdateModel: (model: DataModel) => void
  onUpdateAttribute: (modelId: string, attribute: Attribute) => void
  onDeleteAttribute: (modelId: string, attributeId: string) => void
  onCreateRelationship: (relationship: Omit<Relationship, 'id'>) => void
  onUpdateRelationship: (relationship: Relationship) => void
  onDeleteRelationship: (relationshipId: string) => void
}

export interface DraggedItem {
  type: 'model' | 'attribute'
  modelId: string
  attributeId?: string
  startPosition: { x: number; y: number }
}
