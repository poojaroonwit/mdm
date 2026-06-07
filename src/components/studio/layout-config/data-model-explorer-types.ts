export interface Space {
  id: string
  name: string
  slug?: string
}

export interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
}

export interface Attribute {
  id: string
  name: string
  display_name: string
  type: string
  is_required?: boolean
  is_unique?: boolean
}
