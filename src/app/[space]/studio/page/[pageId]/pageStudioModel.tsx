import {
  BarChart3,
  FileText,
  Grid3X3,
  GripVertical,
  Image,
  List,
  Table,
  Zap,
} from 'lucide-react'

export interface PageComponent {
  id: string
  type: string
  name: string
  props: Record<string, any>
  position: { x: number; y: number }
  size: { width: number; height: number }
  children?: PageComponent[]
}

export interface PageLayout {
  id: string
  name: string
  type: 'sidebar' | 'top-menu' | 'footer' | 'full-width'
  config: Record<string, any>
}

export const componentLibrary = [
  { type: 'text', name: 'Text', icon: FileText, description: 'Add text content' },
  { type: 'button', name: 'Button', icon: Zap, description: 'Interactive button' },
  { type: 'image', name: 'Image', icon: Image, description: 'Display images' },
  { type: 'table', name: 'Table', icon: Table, description: 'Data table' },
  { type: 'chart', name: 'Chart', icon: BarChart3, description: 'Data visualization' },
  { type: 'form', name: 'Form', icon: FileText, description: 'Input form' },
  { type: 'card', name: 'Card', icon: Grid3X3, description: 'Content card' },
  { type: 'list', name: 'List', icon: List, description: 'Item list' },
  { type: 'divider', name: 'Divider', icon: GripVertical, description: 'Visual separator' },
  { type: 'spacer', name: 'Spacer', icon: GripVertical, description: 'Empty space' }
]

export function getDefaultProps(type: string): Record<string, any> {
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
    spacer: { height: 20 }
  }
  return defaults[type] || {}
}

export function renderComponent(component: PageComponent) {
  switch (component.type) {
    case 'text':
      return (
        <div style={{ fontSize: component.props.fontSize, color: component.props.color }}>
          {component.props.content}
        </div>
      )
    case 'button':
      return (
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded">
          {component.props.text}
        </button>
      )
    case 'image':
      return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          {component.props.src ? (
            <img src={component.props.src} alt={component.props.alt} className="max-w-full max-h-full object-contain" />
          ) : (
            <span className="text-muted-foreground">No image</span>
          )}
        </div>
      )
    case 'table':
      return (
        <table className="w-full border-collapse border">
          <tbody>
            {Array.from({ length: component.props.rows }, (_, i) => (
              <tr key={i}>
                {Array.from({ length: component.props.columns }, (_, j) => (
                  <td key={j} className="border p-2">Cell {i + 1},{j + 1}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )
    case 'card':
      return (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">{component.props.title}</h3>
          <p className="text-sm text-muted-foreground">{component.props.content}</p>
        </div>
      )
    case 'list':
      return (
        <ul className={component.props.ordered ? 'list-decimal' : 'list-disc'}>
          {component.props.items.map((item: string, index: number) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )
    case 'divider':
      return (
        <hr style={{ borderWidth: component.props.thickness, borderColor: component.props.color }} />
      )
    case 'spacer':
      return (
        <div style={{ height: component.props.height }} />
      )
    default:
      return <div className="text-muted-foreground">Unknown component</div>
  }
}
