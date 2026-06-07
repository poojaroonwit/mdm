export interface DataModel {
  id: string
  name: string
  display_name: string
  attributes: Attribute[]
}

export interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
}

export interface Relationship {
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

export interface RelationshipTypeInfo {
  type: Relationship['type']
  name: string
  description: string
  icon: string
  color: string
}

export interface NewRelationshipDraft {
  name: string
  description: string
  type: string
  source_model: string
  target_model: string
  source_attribute: string
  target_attribute: string
  cascade_delete: boolean
  cascade_update: boolean
}

export const RELATIONSHIP_TYPES: RelationshipTypeInfo[] = [
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

export const emptyRelationshipDraft: NewRelationshipDraft = {
  name: '',
  description: '',
  type: 'one_to_many',
  source_model: '',
  target_model: '',
  source_attribute: '',
  target_attribute: '',
  cascade_delete: false,
  cascade_update: true
}

export function validateRelationship(relationship: Relationship): { valid: boolean; errors: string[] } {
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
