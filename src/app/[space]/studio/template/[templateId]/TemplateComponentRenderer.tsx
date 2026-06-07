export interface TemplateComponent {
  id: string
  type: string
  name: string
  props: Record<string, any>
  position: { x: number; y: number }
  size: { width: number; height: number }
  children?: TemplateComponent[]
}

export function renderTemplateComponent(component: TemplateComponent) {
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
      return <hr style={{ borderWidth: component.props.thickness, borderColor: component.props.color }} />
    case 'spacer':
      return <div style={{ height: component.props.height }} />
    case 'entity_table':
      return (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Entity Table</h3>
          <p className="text-sm text-muted-foreground">Entity: {component.props.entityType}</p>
          <p className="text-sm text-muted-foreground">Columns: {component.props.columns.join(', ')}</p>
        </div>
      )
    case 'analytics_chart':
      return (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">{component.props.title}</h3>
          <div className="w-full h-32 bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Chart Preview</span>
          </div>
        </div>
      )
    case 'form_builder':
      return (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Form Builder</h3>
          <p className="text-sm text-muted-foreground">Fields: {component.props.fields.length}</p>
        </div>
      )
    default:
      return <div className="text-muted-foreground">Unknown component</div>
  }
}
