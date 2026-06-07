import { Grid, Layout, List, Table } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import type { RecordConfigData } from './record-config-model'

interface RecordLayoutTabProps {
  config: RecordConfigData
  onConfigUpdate: (updates: Partial<RecordConfigData>) => void
}

export function RecordLayoutTab({ config, onConfigUpdate }: RecordLayoutTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Layout Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="layout-mode">Display Mode</Label>
          <Select
            value={config.layout.mode}
            onValueChange={(value) => onConfigUpdate({ layout: { ...config.layout, mode: value as any } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">
                <div className="flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Table
                </div>
              </SelectItem>
              <SelectItem value="list">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  List
                </div>
              </SelectItem>
              <SelectItem value="grid">
                <div className="flex items-center gap-2">
                  <Grid className="h-4 w-4" />
                  Grid
                </div>
              </SelectItem>
              <SelectItem value="card">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Card
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="layout-columns">Columns</Label>
          <Select
            value={config.layout.columns.toString()}
            onValueChange={(value) => onConfigUpdate({ layout: { ...config.layout, columns: parseInt(value) } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Column</SelectItem>
              <SelectItem value="2">2 Columns</SelectItem>
              <SelectItem value="3">3 Columns</SelectItem>
              <SelectItem value="4">4 Columns</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="layout-density">Density</Label>
          <Select
            value={config.layout.density}
            onValueChange={(value) => onConfigUpdate({ layout: { ...config.layout, density: value as any } })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <LayoutToggle
            id="show-headers"
            label="Show Headers"
            checked={config.layout.showHeaders}
            onCheckedChange={(checked) => onConfigUpdate({ layout: { ...config.layout, showHeaders: checked } })}
          />
          <LayoutToggle
            id="show-borders"
            label="Show Borders"
            checked={config.layout.showBorders}
            onCheckedChange={(checked) => onConfigUpdate({ layout: { ...config.layout, showBorders: checked } })}
          />
          <LayoutToggle
            id="alternating-rows"
            label="Alternating Rows"
            checked={config.layout.alternatingRows}
            onCheckedChange={(checked) => onConfigUpdate({ layout: { ...config.layout, alternatingRows: checked } })}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function LayoutToggle({
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
