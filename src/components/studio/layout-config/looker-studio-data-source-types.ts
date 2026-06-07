import type { PlacedWidget } from './widgets'

export interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
  is_required?: boolean
  is_unique?: boolean
}

export interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
}

export interface FieldConfig {
  fieldName: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'COUNT_DISTINCT' | 'MIN' | 'MAX' | 'NONE'
  format?: string
  type: 'dimension' | 'metric'
}

export interface FilterConfig {
  field: string
  operator:
    | 'EQUALS'
    | 'NOT_EQUALS'
    | 'CONTAINS'
    | 'NOT_CONTAINS'
    | 'GREATER_THAN'
    | 'LESS_THAN'
    | 'BETWEEN'
    | 'IN'
    | 'NOT_IN'
  value: any
  value2?: any
}

export interface SortConfig {
  field: string
  direction: 'ASC' | 'DESC'
}

export type WidgetPropertyUpdater = (key: string, value: any) => void

export interface LookerConfigCommonProps {
  widget: PlacedWidget
  attributes: Attribute[]
  expandedSections: Set<string>
  toggleSection: (section: string) => void
  updateProperty: WidgetPropertyUpdater
}
