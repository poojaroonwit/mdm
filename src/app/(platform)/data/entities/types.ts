export type DataModel = {
  id: string
  name: string
  display_name: string
  description?: string
}

export type Attribute = {
  id: string
  name: string
  display_name: string
  type: string
  is_required: boolean
  is_unique: boolean
  order: number
  options?: any
}

export type DataRecord = {
  id: string
  data_model_id: string
  created_at: string
  updated_at: string
  values?: Record<string, any>
}

export type SortConfig = {
  key: string
  direction: 'asc' | 'desc'
}

export type AdvancedFilter = {
  id: string
  attribute: string
  operator: string
  value: string
}

export type FilterSet = {
  id: string
  name: string
  description?: string
  filters: AdvancedFilter[]
  isPublic: boolean
  createdBy: string
  createdAt?: string
  dataModelId?: string
}


