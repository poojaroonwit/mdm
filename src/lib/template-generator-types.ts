export interface DataModel {
  id: string
  name: string
  display_name: string
  description?: string
  table_name: string
  attributes: Array<{
    id: string
    name: string
    display_name: string
    type: string
    required: boolean
    unique: boolean
  }>
  created_at: string
  updated_at: string
}

export interface TemplatePage {
  id: string
  name: string
  displayName: string
  description: string
  components: Array<{
    id: string
    type: string
    x: number
    y: number
    width: number
    height: number
    config: any
  }>
  background: {
    type: 'color' | 'image'
    color?: string
    image?: string
    opacity?: number
    blur?: number
    position?: string
    size?: string
  }
}

export interface Template {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  dataModelId: string
  version: string
  pages: TemplatePage[]
  sidebarConfig: {
    items: Array<{
      id: string
      type: 'page' | 'divider' | 'group' | 'text'
      name: string
      icon?: string
      color?: string
      pageId?: string
      children?: any[]
    }>
    background: string
    textColor: string
    fontSize: string
  }
  createdAt: string
  updatedAt: string
}
