export interface EavEntity {
  id: string
  entityTypeId: string
  externalId?: string
  isActive: boolean
  metadata?: any
  createdBy?: string
  createdAt: string
  updatedAt: string
  values?: Record<string, any>
}

export interface EavAttribute {
  id: string
  name: string
  displayName: string
  dataType: string
  isRequired: boolean
  isUnique: boolean
  defaultValue?: string
  options?: any
  validationRules?: any
  sortOrder: number
  isVisible: boolean
  isEditable: boolean
  helpText?: string
  placeholder?: string
  attributeGroupId?: string
}

export interface EntityType {
  id: string
  name: string
  displayName: string
  description?: string
  isActive: boolean
  sortOrder: number
}

export interface AttributeGroup {
  id: string
  name: string
  displayName: string
  description?: string
  sortOrder: number
  isCollapsible: boolean
  isRequired: boolean
}

export function getValueFieldName(dataType: string): string {
  switch (dataType.toUpperCase()) {
    case 'NUMBER':
    case 'CURRENCY':
    case 'PERCENTAGE':
      return 'numberValue'
    case 'BOOLEAN':
      return 'booleanValue'
    case 'DATE':
      return 'dateValue'
    case 'DATETIME':
    case 'TIMESTAMP':
      return 'datetimeValue'
    case 'JSON':
      return 'jsonValue'
    case 'BLOB':
    case 'FILE':
      return 'blobValue'
    default:
      return 'textValue'
  }
}
