import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import type { RecordConfigData } from './record-config-model'

interface RecordDisplayTabProps {
  config: RecordConfigData
  onConfigUpdate: (updates: Partial<RecordConfigData>) => void
}

export function RecordDisplayTab({ config, onConfigUpdate }: RecordDisplayTabProps) {
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Display Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <DisplayToggle
              id="show-pagination"
              label="Show Pagination"
              checked={config.display.showPagination}
              onCheckedChange={(checked) => onConfigUpdate({ display: { ...config.display, showPagination: checked } })}
            />
            <DisplayToggle
              id="show-search"
              label="Show Search"
              checked={config.display.showSearch}
              onCheckedChange={(checked) => onConfigUpdate({ display: { ...config.display, showSearch: checked } })}
            />
            <DisplayToggle
              id="show-filters"
              label="Show Filters"
              checked={config.display.showFilters}
              onCheckedChange={(checked) => onConfigUpdate({ display: { ...config.display, showFilters: checked } })}
            />
            <DisplayToggle
              id="show-sorting"
              label="Show Sorting"
              checked={config.display.showSorting}
              onCheckedChange={(checked) => onConfigUpdate({ display: { ...config.display, showSorting: checked } })}
            />
            <DisplayToggle
              id="show-actions"
              label="Show Actions"
              checked={config.display.showActions}
              onCheckedChange={(checked) => onConfigUpdate({ display: { ...config.display, showActions: checked } })}
            />
          </div>

          {config.display.showPagination && (
            <div>
              <Label htmlFor="page-size">Page Size</Label>
              <Input
                id="page-size"
                type="number"
                value={config.display.pageSize}
                onChange={(event) => onConfigUpdate({
                  display: { ...config.display, pageSize: parseInt(event.target.value) || 20 }
                })}
                min="1"
                max="100"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <DisplayToggle
            id="allow-create"
            label="Allow Create"
            checked={config.actions.allowCreate}
            onCheckedChange={(checked) => onConfigUpdate({ actions: { ...config.actions, allowCreate: checked } })}
          />
          <DisplayToggle
            id="allow-edit"
            label="Allow Edit"
            checked={config.actions.allowEdit}
            onCheckedChange={(checked) => onConfigUpdate({ actions: { ...config.actions, allowEdit: checked } })}
          />
          <DisplayToggle
            id="allow-delete"
            label="Allow Delete"
            checked={config.actions.allowDelete}
            onCheckedChange={(checked) => onConfigUpdate({ actions: { ...config.actions, allowDelete: checked } })}
          />
          <DisplayToggle
            id="allow-export"
            label="Allow Export"
            checked={config.actions.allowExport}
            onCheckedChange={(checked) => onConfigUpdate({ actions: { ...config.actions, allowExport: checked } })}
          />
          <DisplayToggle
            id="allow-bulk-actions"
            label="Allow Bulk Actions"
            checked={config.actions.allowBulkActions}
            onCheckedChange={(checked) => onConfigUpdate({ actions: { ...config.actions, allowBulkActions: checked } })}
          />
        </CardContent>
      </Card>
    </>
  )
}

function DisplayToggle({
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
