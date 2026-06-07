import { Database, Plus, Trash2, Type } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { fieldTypeIcons, type RecordField } from './record-config-model'

interface RecordFieldsTabProps {
  fields: RecordField[]
  onAddField: () => void
  onFieldUpdate: (fieldId: string, updates: Partial<RecordField>) => void
  onRemoveField: (fieldId: string) => void
}

export function RecordFieldsTab({
  fields,
  onAddField,
  onFieldUpdate,
  onRemoveField
}: RecordFieldsTabProps) {
  const renderFieldIcon = (type: string) => {
    const IconComponent = fieldTypeIcons[type] || Type
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Data Fields</CardTitle>
          <Button size="sm" onClick={onAddField}>
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {fields.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Database className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">No fields configured</p>
            <p className="text-xs">Add fields to display data records</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field) => (
              <Card key={field.id} className="p-3">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {renderFieldIcon(field.type)}
                    <Input
                      value={field.displayName}
                      onChange={(event) => onFieldUpdate(field.id, { displayName: event.target.value })}
                      placeholder="Field display name"
                      className="flex-1"
                    />
                    <Button size="sm" variant="outline" onClick={() => onRemoveField(field.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
                      <Input
                        id={`field-name-${field.id}`}
                        value={field.name}
                        onChange={(event) => onFieldUpdate(field.id, { name: event.target.value })}
                        placeholder="field_name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`field-type-${field.id}`}>Type</Label>
                      <Select value={field.type} onValueChange={(value) => onFieldUpdate(field.id, { type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEXT">Text</SelectItem>
                          <SelectItem value="NUMBER">Number</SelectItem>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="PHONE">Phone</SelectItem>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="DATE">Date</SelectItem>
                          <SelectItem value="DATETIME">DateTime</SelectItem>
                          <SelectItem value="BOOLEAN">Boolean</SelectItem>
                          <SelectItem value="SELECT">Select</SelectItem>
                          <SelectItem value="MULTISELECT">Multi-Select</SelectItem>
                          <SelectItem value="TEXTAREA">Textarea</SelectItem>
                          <SelectItem value="RICH_TEXT">Rich Text</SelectItem>
                          <SelectItem value="IMAGE">Image</SelectItem>
                          <SelectItem value="FILE">File</SelectItem>
                          <SelectItem value="LOCATION">Location</SelectItem>
                          <SelectItem value="CURRENCY">Currency</SelectItem>
                          <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          <SelectItem value="RATING">Rating</SelectItem>
                          <SelectItem value="COLOR">Color</SelectItem>
                          <SelectItem value="JSON">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <FieldToggle
                      id={`field-required-${field.id}`}
                      label="Required"
                      checked={field.required}
                      onCheckedChange={(checked) => onFieldUpdate(field.id, { required: checked })}
                    />
                    <FieldToggle
                      id={`field-visible-${field.id}`}
                      label="Visible"
                      checked={field.visible}
                      onCheckedChange={(checked) => onFieldUpdate(field.id, { visible: checked })}
                    />
                    <FieldToggle
                      id={`field-editable-${field.id}`}
                      label="Editable"
                      checked={field.editable}
                      onCheckedChange={(checked) => onFieldUpdate(field.id, { editable: checked })}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FieldToggle({
  id,
  label,
  checked,
  onCheckedChange
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center space-x-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  )
}

export function RecordFieldPreview({ field }: { field: RecordField }) {
  const IconComponent = fieldTypeIcons[field.type] || Type

  return (
    <div className="flex items-center gap-2 rounded border border-border p-2">
      <IconComponent className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <div className="text-sm font-medium">{field.displayName}</div>
        <div className="text-xs text-muted-foreground">{field.type}</div>
      </div>
      <div className="flex items-center gap-1">
        {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
        {!field.visible && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
        {!field.editable && <Badge variant="outline" className="text-xs">Read-only</Badge>}
      </div>
    </div>
  )
}
