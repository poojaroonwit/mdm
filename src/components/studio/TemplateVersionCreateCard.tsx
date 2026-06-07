import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

interface NewVersionDraft {
  version: string
  name: string
  description: string
  changes: string[]
  isStable: boolean
  tags: string[]
}

interface TemplateVersionCreateCardProps {
  newVersion: NewVersionDraft
  setNewVersion: React.Dispatch<React.SetStateAction<NewVersionDraft>>
  onGenerateNextVersion: () => void
  onCreateVersion: () => void
  onCancel: () => void
}

export function TemplateVersionCreateCard({
  newVersion,
  setNewVersion,
  onGenerateNextVersion,
  onCreateVersion,
  onCancel
}: TemplateVersionCreateCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Version</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Version Number</Label>
            <div className="flex gap-2">
              <Input
                value={newVersion.version}
                onChange={(e) => setNewVersion(prev => ({ ...prev, version: e.target.value }))}
                placeholder="1.0.0"
              />
              <Button variant="outline" onClick={onGenerateNextVersion}>
                Auto
              </Button>
            </div>
          </div>
          <div>
            <Label>Version Name</Label>
            <Input
              value={newVersion.name}
              onChange={(e) => setNewVersion(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Initial Release"
            />
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={newVersion.description}
            onChange={(e) => setNewVersion(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what's new in this version..."
            rows={3}
          />
        </div>

        <div>
          <Label>Changes</Label>
          {newVersion.changes.map((change, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <Input
                value={change}
                onChange={(e) => {
                  const newChanges = [...newVersion.changes]
                  newChanges[index] = e.target.value
                  setNewVersion(prev => ({ ...prev, changes: newChanges }))
                }}
                placeholder="Added new feature..."
              />
              {newVersion.changes.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newChanges = newVersion.changes.filter((_, i) => i !== index)
                    setNewVersion(prev => ({ ...prev, changes: newChanges }))
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNewVersion(prev => ({ ...prev, changes: [...prev.changes, ''] }))}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Change
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={newVersion.isStable}
              onCheckedChange={(checked) => setNewVersion(prev => ({ ...prev, isStable: checked }))}
            />
            <Label>Mark as stable release</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onCreateVersion}>
            Create Version
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
