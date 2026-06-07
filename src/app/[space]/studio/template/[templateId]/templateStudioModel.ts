import {
  BarChart3,
  Database,
  FileText,
  Grid3X3,
  GripVertical,
  Image,
  List,
  Table,
  Zap,
} from 'lucide-react'

export const TEMPLATE_COMPONENT_CATEGORIES = ['All', 'Basic', 'Data', 'Forms', 'Layout', 'Advanced']

export const TEMPLATE_COMPONENT_LIBRARY = [
  { type: 'text', name: 'Text', icon: FileText, description: 'Add text content', category: 'Basic' },
  { type: 'button', name: 'Button', icon: Zap, description: 'Interactive button', category: 'Basic' },
  { type: 'image', name: 'Image', icon: Image, description: 'Display images', category: 'Basic' },
  { type: 'table', name: 'Table', icon: Table, description: 'Data table', category: 'Data' },
  { type: 'chart', name: 'Chart', icon: BarChart3, description: 'Data visualization', category: 'Data' },
  { type: 'form', name: 'Form', icon: FileText, description: 'Input form', category: 'Forms' },
  { type: 'card', name: 'Card', icon: Grid3X3, description: 'Content card', category: 'Layout' },
  { type: 'list', name: 'List', icon: List, description: 'Item list', category: 'Layout' },
  { type: 'divider', name: 'Divider', icon: GripVertical, description: 'Visual separator', category: 'Layout' },
  { type: 'spacer', name: 'Spacer', icon: GripVertical, description: 'Empty space', category: 'Layout' },
  { type: 'entity_table', name: 'Entity Table', icon: Database, description: 'Dynamic data table', category: 'Advanced' },
  { type: 'analytics_chart', name: 'Analytics Chart', icon: BarChart3, description: 'Advanced charts', category: 'Advanced' },
  { type: 'form_builder', name: 'Form Builder', icon: FileText, description: 'Dynamic forms', category: 'Advanced' }
]

export function getDefaultTemplateComponentProps(type: string): Record<string, any> {
  const defaults: Record<string, any> = {
    text: { content: 'Sample text', fontSize: 16, color: '#000000' },
    button: { text: 'Click me', variant: 'default', size: 'md' },
    image: { src: '', alt: 'Image', width: 200, height: 150 },
    table: { columns: 3, rows: 3, data: [] },
    chart: { type: 'bar', data: [], width: 400, height: 300 },
    form: { fields: [], submitText: 'Submit' },
    card: { title: 'Card Title', content: 'Card content' },
    list: { items: ['Item 1', 'Item 2', 'Item 3'], ordered: false },
    divider: { thickness: 1, color: '#e5e7eb' },
    spacer: { height: 20 },
    entity_table: {
      entityType: 'customer',
      columns: ['name', 'email', 'phone'],
      actions: ['view', 'edit', 'delete']
    },
    analytics_chart: {
      type: 'line',
      data: [],
      title: 'Analytics Chart',
      width: 400,
      height: 300
    },
    form_builder: {
      fields: [],
      submitAction: 'save',
      validation: true
    }
  }
  return defaults[type] || {}
}
