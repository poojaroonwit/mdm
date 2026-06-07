import { Copy, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { TemplateComponent } from './TemplateComponentRenderer'

interface TemplateComponentPropertiesPanelProps {
  selectedComponent: TemplateComponent | null
  updateComponent: (id: string, updates: Partial<TemplateComponent>) => void
  duplicateComponent: (id: string) => void
  deleteComponent: (id: string) => void
}

export function TemplateComponentPropertiesPanel({
  selectedComponent,
  updateComponent,
  duplicateComponent,
  deleteComponent
}: TemplateComponentPropertiesPanelProps) {
  if (!selectedComponent) return null

  return (
    <div className="w-80 border-l bg-card">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold">Component Properties</h3>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <Label>Component Name</Label>
          <Input
            value={selectedComponent.name}
            onChange={(event) => updateComponent(selectedComponent.id, { name: event.target.value })}
          />
        </div>
        <div>
          <Label>Position X</Label>
          <Input
            type="number"
            value={selectedComponent.position.x}
            onChange={(event) => updateComponent(selectedComponent.id, {
              position: { ...selectedComponent.position, x: parseInt(event.target.value) || 0 }
            })}
          />
        </div>
        <div>
          <Label>Position Y</Label>
          <Input
            type="number"
            value={selectedComponent.position.y}
            onChange={(event) => updateComponent(selectedComponent.id, {
              position: { ...selectedComponent.position, y: parseInt(event.target.value) || 0 }
            })}
          />
        </div>
        <div>
          <Label>Width</Label>
          <Input
            type="number"
            value={selectedComponent.size.width}
            onChange={(event) => updateComponent(selectedComponent.id, {
              size: { ...selectedComponent.size, width: parseInt(event.target.value) || 0 }
            })}
          />
        </div>
        <div>
          <Label>Height</Label>
          <Input
            type="number"
            value={selectedComponent.size.height}
            onChange={(event) => updateComponent(selectedComponent.id, {
              size: { ...selectedComponent.size, height: parseInt(event.target.value) || 0 }
            })}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => duplicateComponent(selectedComponent.id)}
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteComponent(selectedComponent.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
