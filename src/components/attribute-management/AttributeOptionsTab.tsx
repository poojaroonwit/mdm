import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Settings, Plus, Trash2 } from 'lucide-react'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'

interface AttributeOption {
  value: string
  label: string
  color: string
  order: number
}

interface DraftAttributeOption {
  value: string
  label: string
  color: string
}

interface AttributeOptionsTabProps {
  attributeType: string
  canEdit: boolean
  newOption: DraftAttributeOption
  options: AttributeOption[]
  showNewOption: boolean
  handleAddNewOption: () => void
  handleAddOption: () => void
  handleOptionChange: (index: number, field: keyof AttributeOption, value: string) => void
  handleRemoveOption: (index: number) => void
  setNewOption: (option: DraftAttributeOption) => void
}

export function AttributeOptionsTab({
  attributeType,
  canEdit,
  newOption,
  options,
  showNewOption,
  handleAddNewOption,
  handleAddOption,
  handleOptionChange,
  handleRemoveOption,
  setNewOption
}: AttributeOptionsTabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Attribute Options
              </CardTitle>
              <CardDescription>
                Manage the available options for this {attributeType} field. Drag and drop to reorder.
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={handleAddNewOption}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Create New Attribute Option
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                <div className="flex items-center gap-2">
                  <ColorInput
                    value={option.color || '#1e40af'}
                    onChange={(color) => handleOptionChange(index, 'color', color)}
                    allowImageVideo={false}
                    disabled={!canEdit}
                    className="relative"
                    placeholder="#1e40af"
                    inputClassName="h-8 text-xs pl-7"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    value={option.value}
                    onChange={(event) => handleOptionChange(index, 'value', event.target.value)}
                    placeholder="Option value"
                    className="h-8"
                    disabled={!canEdit}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    value={option.label}
                    onChange={(event) => handleOptionChange(index, 'label', event.target.value)}
                    placeholder="Option label"
                    className="h-8"
                    disabled={!canEdit}
                  />
                </div>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    disabled={options.length === 1}
                    className="h-8"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            {canEdit && showNewOption && (
              <div className="p-4 border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ColorInput
                      value={newOption.color}
                      onChange={(color) => setNewOption({ ...newOption, color })}
                      allowImageVideo={false}
                      className="relative"
                      placeholder="#1e40af"
                      inputClassName="h-8 text-xs pl-7"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      value={newOption.value}
                      onChange={(event) => setNewOption({ ...newOption, value: event.target.value })}
                      placeholder="Option value"
                      className="h-8"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Input
                      value={newOption.label}
                      onChange={(event) => setNewOption({ ...newOption, label: event.target.value })}
                      placeholder="Option label"
                      className="h-8"
                    />
                  </div>
                  <Button
                    onClick={handleAddOption}
                    disabled={!newOption.value.trim() || !newOption.label.trim()}
                    className="h-8"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {options.length === 0 && !showNewOption && (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium">No options yet</p>
                <p className="text-sm">Add options for this {attributeType} field</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
